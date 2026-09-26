"""Business logic for differentiators (demo-safe, no external AI required)."""
from decimal import Decimal
from datetime import timedelta, date
from django.db import transaction
from django.db.models import Avg, Count, Q
from django.utils import timezone
from django.core.exceptions import ValidationError

from insights.models import (
    UnderstandingCheck,
    TopicMastery,
    BaselineSnapshot,
    EffectivenessReport,
    ParentLink,
    ParentWeeklyTip,
    OfflineSyncBatch,
    CreatorReward,
    CreatorBalance,
)
from submissions.models import Submission
from audit.models import AuditLog


UC_THRESHOLD = Decimal("0.95")  # 95%+
UC_WINDOW_SECONDS = 30


def _pct(score, max_score) -> Decimal:
    if not max_score or Decimal(str(max_score)) == 0:
        return Decimal("0")
    return (Decimal(str(score)) / Decimal(str(max_score))).quantize(Decimal("0.0001"))


def _rephrase_demo(assignment, submission) -> tuple[str, str]:
    """Demo micro-question from first snapshot item — replace with real LLM later."""
    snap = assignment.question_snapshot or []
    if not snap:
        return (
            "Bu mavzuni o‘z so‘zlaringiz bilan qisqa tushuntiring.",
            "O‘qituvchi baholaydi",
        )
    q = snap[0]
    text = q.get("text") or "Mavzu"
    prompt = (
        f"Siz hozir yuqori natija oldingiz. 30 soniya ichida javob bering.\n"
        f"Shu masalani boshqacha so‘zlab ayting: «{text[:180]}» — "
        f"qisqa javob yozing (1–2 gap)."
    )
    hint = f"Asl savol: {text[:200]}"
    return prompt, hint


@transaction.atomic
def maybe_create_understanding_check(submission: Submission) -> UnderstandingCheck | None:
    if submission.status not in (
        Submission.Status.PUBLISHED,
        Submission.Status.GRADED,
    ):
        return None
    if submission.score is None or not submission.max_score:
        return None
    if _pct(submission.score, submission.max_score) < UC_THRESHOLD:
        return None
    if UnderstandingCheck.objects.filter(submission=submission).exists():
        return None

    assignment = submission.assignment
    school = assignment.school
    prompt, hint = _rephrase_demo(assignment, submission)
    now = timezone.now()
    uc = UnderstandingCheck.objects.create(
        submission=submission,
        student_id=submission.student_id,
        assignment=assignment,
        school=school,
        prompt_text=prompt,
        expected_hint=hint,
        status=UnderstandingCheck.Status.SENT,
        window_seconds=UC_WINDOW_SECONDS,
        sent_at=now,
        expires_at=now + timedelta(seconds=UC_WINDOW_SECONDS),
        prompt_meta={"threshold": str(UC_THRESHOLD), "demo": True},
    )
    from notifications.models import Notification

    Notification.objects.create(
        user_id=submission.student_id,
        title="Tushunish tasdig‘i (30 soniya)",
        body=prompt[:300],
        link=f"/understanding/{uc.id}",
    )
    return uc


@transaction.atomic
def answer_understanding_check(*, uc: UnderstandingCheck, answer: str) -> UnderstandingCheck:
    uc = UnderstandingCheck.objects.select_for_update().get(pk=uc.pk)
    if uc.status == UnderstandingCheck.Status.ANSWERED:
        return uc
    now = timezone.now()
    if uc.expires_at and now > uc.expires_at:
        uc.status = UnderstandingCheck.Status.EXPIRED
        uc.outcome = UnderstandingCheck.Outcome.EXPIRED
        uc.flag_teacher = True
        uc.save()
        return uc

    ans = (answer or "").strip()
    uc.student_answer = ans
    uc.answered_at = now
    uc.status = UnderstandingCheck.Status.ANSWERED
    # Demo heuristic: very short / empty → fail
    if len(ans) < 8:
        uc.outcome = UnderstandingCheck.Outcome.FAIL
        uc.flag_teacher = True
    else:
        uc.outcome = UnderstandingCheck.Outcome.PASS
        uc.flag_teacher = False
    uc.save()
    if uc.flag_teacher:
        AuditLog.objects.create(
            actor_id=uc.student_id,
            school=uc.school,
            action="understanding.flag",
            object_type="UnderstandingCheck",
            object_id=str(uc.id),
            message="Ehtimol yordam bilan qilingan (UC fail/short)",
        )
    return uc


def update_topic_mastery_from_submission(submission: Submission):
    """Simple Bayesian-ish bump — not Squirrel-level, but real tracking."""
    assignment = submission.assignment
    if submission.score is None or not submission.max_score:
        return
    pct = float(_pct(submission.score, submission.max_score))
    topic_key = (assignment.title or "general")[:120]
    topic_label = assignment.title or "Umumiy"
    subject = assignment.subject
    if not subject:
        return
    row, _ = TopicMastery.objects.get_or_create(
        student_id=submission.student_id,
        school=assignment.school,
        subject=subject,
        topic_key=topic_key,
        defaults={"topic_label": topic_label, "p_know": Decimal("0.30")},
    )
    row.attempts += 1
    if pct >= 0.7:
        row.correct += 1
        # move toward 1
        row.p_know = min(
            Decimal("0.99"),
            (Decimal(str(row.p_know)) * Decimal("0.7") + Decimal(str(pct)) * Decimal("0.3")),
        )
        row.last_result = "ok"
    else:
        row.p_know = max(
            Decimal("0.05"),
            (Decimal(str(row.p_know)) * Decimal("0.7") + Decimal(str(pct)) * Decimal("0.3")),
        )
        row.last_result = "weak"
    row.topic_label = topic_label
    row.save()


def compute_class_metrics(class_group, period_start, period_end) -> dict:
    qs = Submission.objects.filter(
        assignment__targets__class_group=class_group,
        status=Submission.Status.PUBLISHED,
        graded_at__date__gte=period_start,
        graded_at__date__lte=period_end,
    )
    agg = qs.aggregate(avg=Avg("score"), n=Count("id"))
    students = (
        qs.values("student_id").distinct().count()
    )
    return {
        "avg_score": float(agg["avg"] or 0),
        "submissions": agg["n"] or 0,
        "students": students,
        "period_start": str(period_start),
        "period_end": str(period_end),
        "class_group_id": class_group.id,
        "class_name": class_group.name,
    }


@transaction.atomic
def create_baseline(*, school, class_group, label, period_start, period_end, actor):
    metrics = compute_class_metrics(class_group, period_start, period_end)
    return BaselineSnapshot.objects.create(
        school=school,
        class_group=class_group,
        label=label,
        period_start=period_start,
        period_end=period_end,
        metrics=metrics,
        created_by=actor,
    )


@transaction.atomic
def create_before_after_report(*, school, baseline: BaselineSnapshot, actor) -> EffectivenessReport:
    cg = baseline.class_group
    end = timezone.now().date()
    start = end - timedelta(days=30)
    current = compute_class_metrics(cg, start, end) if cg else {}
    before = baseline.metrics or {}
    delta = {
        "avg_score_before": before.get("avg_score"),
        "avg_score_after": current.get("avg_score"),
        "avg_score_delta": (current.get("avg_score") or 0) - (before.get("avg_score") or 0),
        "submissions_before": before.get("submissions"),
        "submissions_after": current.get("submissions"),
    }
    narrative = (
        f"Sinf {cg.name if cg else '?'}: o‘rtacha ball "
        f"{before.get('avg_score', 0):.1f} → {current.get('avg_score', 0):.1f} "
        f"(Δ {delta['avg_score_delta']:+.1f}). "
        f"Bu avtomatik oldin-keyin solishtiruv."
    )
    return EffectivenessReport.objects.create(
        school=school,
        kind=EffectivenessReport.Kind.BEFORE_AFTER,
        title=f"Oldin-keyin: {baseline.label}",
        class_a=cg,
        baseline=baseline,
        summary={"before": before, "after": current, "delta": delta},
        narrative=narrative,
        created_by=actor,
    )


@transaction.atomic
def create_ab_report(*, school, class_a, class_b, period_start, period_end, actor):
    ma = compute_class_metrics(class_a, period_start, period_end)
    mb = compute_class_metrics(class_b, period_start, period_end)
    narrative = (
        f"A/B: {class_a.name} o‘rtacha {ma.get('avg_score', 0):.1f} vs "
        f"{class_b.name} {mb.get('avg_score', 0):.1f}."
    )
    return EffectivenessReport.objects.create(
        school=school,
        kind=EffectivenessReport.Kind.AB,
        title=f"A/B {class_a.name} vs {class_b.name}",
        class_a=class_a,
        class_b=class_b,
        summary={"a": ma, "b": mb},
        narrative=narrative,
        created_by=actor,
    )


def week_key(d: date | None = None) -> str:
    d = d or timezone.now().date()
    iso = d.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


@transaction.atomic
def generate_parent_tip(*, parent_link: ParentLink, actor=None) -> ParentWeeklyTip:
    student = parent_link.student
    wk = week_key()
    if ParentWeeklyTip.objects.filter(parent_link=parent_link, week_key=wk).exists():
        raise ValidationError("Bu hafta uchun maslahat allaqachon yaratilgan.")

    # weakest topic
    weak = (
        TopicMastery.objects.filter(student=student)
        .order_by("p_know")
        .first()
    )
    school = None
    mem = student.memberships.filter(is_active=True).first()
    if mem:
        school = mem.school
    if not school:
        raise ValidationError("Maktab topilmadi.")

    if weak:
        topic = weak.topic_label or weak.topic_key
        body = (
            f"Bu hafta farzandingiz «{topic}» mavzusida qiynalmoqda "
            f"(tushunish ehtimoli ≈ {float(weak.p_know)*100:.0f}%).\n\n"
            f"Bugun kechqurun 5 daqiqa: unga shu savolni bering — "
            f"«{topic} haqida o‘z so‘zing bilan 1 misol keltir».\n\n"
            f"— Mirae Maktab, ota-ona uchun 5 daqiqa"
        )
        topic_key = weak.topic_key
    else:
        body = (
            "Bu hafta farzandingiz natijalari yig‘ilmoqda.\n\n"
            "5 daqiqa: undan so‘rang — «Bugun maktabda eng qiziq narsa nima bo‘ldi?»\n\n"
            "— Mirae Maktab, ota-ona uchun 5 daqiqa"
        )
        topic_key = ""

    tip = ParentWeeklyTip.objects.create(
        parent_link=parent_link,
        student=student,
        school=school,
        week_key=wk,
        title="Ota-ona uchun 5 daqiqa",
        body=body,
        topic_key=topic_key,
        status=ParentWeeklyTip.Status.QUEUED,
    )
    return tip


@transaction.atomic
def apply_offline_sync(*, student, client_batch_id: str, items: list) -> OfflineSyncBatch:
    """
    items: [{assignment_id, answers: [...], client_submitted_at}]
    Idempotent on client_batch_id.
    """
    existing = OfflineSyncBatch.objects.filter(
        student=student, client_batch_id=client_batch_id
    ).first()
    if existing:
        return existing

    batch = OfflineSyncBatch.objects.create(
        student=student,
        client_batch_id=client_batch_id,
        payload={"items": items},
        status=OfflineSyncBatch.Status.RECEIVED,
    )
    applied = []
    errors = []
    from submissions.services import start_digital, finish_digital

    for it in items or []:
        try:
            asg_id = it.get("assignment_id")
            answers = it.get("answers") or []
            sub = start_digital(student=student, assignment_id=asg_id)
            sub = finish_digital(student=student, submission_id=sub.id, answers_payload=answers)
            applied.append({"assignment_id": asg_id, "submission_id": sub.id})
            # hooks
            maybe_create_understanding_check(sub)
            update_topic_mastery_from_submission(sub)
        except Exception as e:
            errors.append({"assignment_id": it.get("assignment_id"), "error": str(e)})

    batch.result = {"applied": applied, "errors": errors}
    batch.status = (
        OfflineSyncBatch.Status.APPLIED
        if applied and not errors
        else OfflineSyncBatch.Status.PARTIAL
        if applied
        else OfflineSyncBatch.Status.REJECTED
    )
    batch.save()
    return batch


@transaction.atomic
def record_question_reuse(*, question, used_by_teacher, school=None):
    """When teacher B uses teacher A's question — credit A."""
    owner = getattr(question, "created_by", None) or getattr(question, "author", None)
    if not owner or owner.id == used_by_teacher.id:
        return None
    bal, _ = CreatorBalance.objects.get_or_create(teacher=owner)
    bal.points += 10
    bal.reuse_count += 1
    bal.save()
    return CreatorReward.objects.create(
        teacher=owner,
        question=question,
        kind=CreatorReward.Kind.REUSE,
        points=10,
        note=f"Qayta ishlatildi ({used_by_teacher.username})",
        meta={"used_by": used_by_teacher.id, "school_id": getattr(school, "id", None)},
    )
