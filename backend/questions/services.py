"""Question bank: create/update creates immutable versions; publish validates."""
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone

from questions.models import Question, QuestionVersion
from audit.models import AuditLog


def _clean_accepted(accepted: list) -> list:
    """B09: drop empty aliases."""
    out = []
    for a in accepted or []:
        if isinstance(a, str) and a.strip() != "":
            out.append(a.strip())
        elif not isinstance(a, str) and a is not None:
            out.append(a)
    return out


def validate_version_payload(qtype: str, data: dict, *, for_active: bool):
    text = (data.get("text") or "").strip()
    if for_active and not text and not (data.get("html") or "").strip():
        raise ValidationError("Savol matni bo‘sh.")

    options = data.get("options") or []
    answer_key = data.get("answer_key") or {}
    accepted = _clean_accepted(data.get("accepted_answers") or [])

    if qtype in (Question.Type.SINGLE, Question.Type.MULTI):
        if for_active:
            if len(options) < 2:
                raise ValidationError("Kamida 2 ta variant kerak.")
            # unique non-empty options when active
            cleaned = [str(o).strip() for o in options]
            if any(not c for c in cleaned):
                raise ValidationError("Bo‘sh variantlar mumkin emas.")
            if len(set(c.lower() for c in cleaned)) != len(cleaned):
                raise ValidationError("Variantlar takrorlanmasligi kerak.")
            correct = answer_key.get("correct", data.get("correct"))
            if qtype == Question.Type.SINGLE:
                if not isinstance(correct, int) or not (0 <= correct < len(options)):
                    raise ValidationError("To‘g‘ri javob indeksi noto‘g‘ri.")
            else:
                corrects = answer_key.get("corrects") or answer_key.get("correct")
                if not isinstance(corrects, list) or not corrects:
                    raise ValidationError("Multi uchun corrects ro‘yxati kerak.")
                for c in corrects:
                    if not isinstance(c, int) or not (0 <= c < len(options)):
                        raise ValidationError("Multi indeks xato.")

    if qtype == Question.Type.SHORT and for_active:
        if not accepted:
            raise ValidationError("Qisqa javob uchun accepted_answers kerak.")
        tol = data.get("numeric_tolerance")
        if tol is not None:
            for a in accepted:
                try:
                    float(a)
                except (TypeError, ValueError):
                    # non-numeric aliases ok; tolerance only applies to numeric pairs
                    pass

    return {
        "text": text or (data.get("html") or "")[:200],
        "html": data.get("html") or "",
        "latex": data.get("latex") or "",
        "options": data.get("options") or [],
        "answer_key": data.get("answer_key")
        or ({"correct": data["correct"]} if "correct" in data else {}),
        "explanation": data.get("explanation") or "",
        "images": data.get("images") or [],
        "accepted_answers": accepted,
        "numeric_tolerance": data.get("numeric_tolerance"),
    }


@transaction.atomic
def create_question(*, school, subject, created_by, meta: dict, content: dict) -> Question:
    qtype = meta["qtype"]
    status = meta.get("status") or Question.Status.DRAFT
    for_active = status == Question.Status.ACTIVE
    payload = validate_version_payload(qtype, content, for_active=for_active)

    q = Question.objects.create(
        school=school,
        subject=subject,
        created_by=created_by,
        qtype=qtype,
        status=status if status != Question.Status.ACTIVE else Question.Status.DRAFT,
        grade=meta.get("grade"),
        difficulty=meta.get("difficulty") or 1,
        xp=meta.get("xp") or 10,
        tags=meta.get("tags") or [],
        dtm_eligible=meta.get("dtm_eligible") or False,
        current_version=1,
    )
    QuestionVersion.objects.create(
        question=q,
        version=1,
        created_by=created_by,
        **payload,
    )
    if status == Question.Status.ACTIVE:
        q = publish_question(question=q, actor=created_by)
    AuditLog.objects.create(
        actor=created_by,
        school=school,
        action="question.created",
        object_type="Question",
        object_id=str(q.id),
        message=f"Savol yaratildi Q{q.id}",
    )
    return q


@transaction.atomic
def update_question_content(*, question: Question, actor, content: dict) -> Question:
    """New immutable version; does not auto-publish."""
    if question.status == Question.Status.ARCHIVED:
        raise ValidationError("Arxivdagi savolni to‘g‘ridan-to‘g‘ri tahrirlab bo‘lmaydi.")
    payload = validate_version_payload(
        question.qtype, content, for_active=False
    )
    new_v = question.current_version + 1
    QuestionVersion.objects.create(
        question=question,
        version=new_v,
        created_by=actor,
        **payload,
    )
    question.current_version = new_v
    # editing active question returns to draft until re-publish? 
    # Product: keep status but bind attempts to version — keep status, just bump version
    question.save(update_fields=["current_version", "updated_at"])
    AuditLog.objects.create(
        actor=actor,
        school=question.school,
        action="question.versioned",
        object_type="Question",
        object_id=str(question.id),
        message=f"Q{question.id} → v{new_v}",
    )
    return question


@transaction.atomic
def publish_question(*, question: Question, actor) -> Question:
    ver = question.versions.filter(version=question.current_version).first()
    if not ver:
        raise ValidationError("Versiya topilmadi.")
    content = {
        "text": ver.text,
        "html": ver.html,
        "options": ver.options,
        "answer_key": ver.answer_key,
        "accepted_answers": ver.accepted_answers,
        "numeric_tolerance": ver.numeric_tolerance,
    }
    validate_version_payload(question.qtype, content, for_active=True)
    question.status = Question.Status.ACTIVE
    question.save(update_fields=["status", "updated_at"])
    AuditLog.objects.create(
        actor=actor,
        school=question.school,
        action="question.published",
        object_type="Question",
        object_id=str(question.id),
        message=f"Q{question.id} faol",
    )
    return question


@transaction.atomic
def archive_question(*, question: Question, actor) -> Question:
    question.status = Question.Status.ARCHIVED
    question.save(update_fields=["status", "updated_at"])
    AuditLog.objects.create(
        actor=actor,
        school=question.school,
        action="question.archived",
        object_type="Question",
        object_id=str(question.id),
        message=f"Q{question.id} arxiv",
    )
    return question


@transaction.atomic
def restore_question(*, question: Question, actor) -> Question:
    """Restore to draft only — must publish again (fixes B15)."""
    if question.status != Question.Status.ARCHIVED:
        raise ValidationError("Faqat arxivdan tiklash mumkin.")
    question.status = Question.Status.DRAFT
    question.save(update_fields=["status", "updated_at"])
    AuditLog.objects.create(
        actor=actor,
        school=question.school,
        action="question.restored",
        object_type="Question",
        object_id=str(question.id),
        message=f"Q{question.id} qoralamaga qaytarildi",
    )
    return question


def version_to_snapshot_item(ver: QuestionVersion, q: Question) -> dict:
    """Shape compatible with assignment.question_snapshot / paper scoring."""
    key = ver.answer_key or {}
    item = {
        "id": q.id,
        "question_id": q.id,
        "version": ver.version,
        "qtype": q.qtype,
        "text": ver.text,
        "html": ver.html,
        "latex": ver.latex,
        "options": ver.options,
        "points": 1,
        "images": ver.images,
        "answer_key": key,
    }
    if "correct" in key:
        item["correct"] = key["correct"]
    return item
