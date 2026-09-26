from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from submissions.models import Submission, Answer
from assignments.models import Assignment
from questions.scoring import score_choice, LETTERS
from accounts.scoping import student_class_enrollment
from audit.models import AuditLog


def _student_can_take(user, assignment: Assignment):
    if assignment.status != Assignment.Status.PUBLISHED:
        raise ValidationError("Vazifa e’lon qilinmagan.")
    en = student_class_enrollment(user)
    if not en:
        raise ValidationError("Sinfga biriktirilmagansiz.")
    if not assignment.targets.filter(class_group_id=en.class_group_id).exists():
        raise ValidationError("Bu vazifa sizning sinfingizga tegishli emas.")
    return en


@transaction.atomic
def start_digital(*, student, assignment_id: int) -> Submission:
    assignment = Assignment.objects.select_for_update().get(pk=assignment_id)
    _student_can_take(student, assignment)
    published = Submission.objects.filter(
        student=student,
        assignment=assignment,
        status=Submission.Status.PUBLISHED,
    ).exists()
    if published:
        raise ValidationError("Natija allaqachon mavjud (qayta topshirish yopiq).")
    open_attempt = (
        Submission.objects.select_for_update()
        .filter(
            student=student,
            assignment=assignment,
            status=Submission.Status.IN_PROGRESS,
            source=Submission.Source.DIGITAL,
        )
        .first()
    )
    if open_attempt:
        return open_attempt
    attempt_no = (
        Submission.objects.filter(student=student, assignment=assignment).count() + 1
    )
    return Submission.objects.create(
        student=student,
        assignment=assignment,
        attempt_no=attempt_no,
        source=Submission.Source.DIGITAL,
        status=Submission.Status.IN_PROGRESS,
        max_score=assignment.max_score,
    )


@transaction.atomic
def finish_digital(*, student, submission_id: int, answers_payload: list) -> Submission:
    sub = (
        Submission.objects.select_for_update()
        .select_related("assignment")
        .get(pk=submission_id, student=student)
    )
    if sub.status != Submission.Status.IN_PROGRESS:
        raise ValidationError("Bu urinish yakunlangan.")
    if sub.source != Submission.Source.DIGITAL:
        raise ValidationError("Faqat raqamli urinish.")

    assignment = sub.assignment
    snapshot = assignment.question_snapshot or []
    by_idx = {a["question_index"]: a["response"] for a in answers_payload}

    # Block if already published (race)
    if Submission.objects.filter(
        student=student,
        assignment=assignment,
        status=Submission.Status.PUBLISHED,
    ).exclude(pk=sub.pk).exists():
        raise ValidationError("Natija allaqachon e’lon qilingan.")

    total = Decimal("0")
    max_total = Decimal("0")
    rows = []
    for i, q in enumerate(snapshot):
        pts = Decimal(str(q.get("points", 1)))
        max_total += pts
        resp = by_idx.get(i) or {}
        marked = []
        if "choice" in resp and resp["choice"] is not None:
            c = resp["choice"]
            if isinstance(c, int):
                marked = [LETTERS[c]] if 0 <= c < len(LETTERS) else []
            elif isinstance(c, str):
                marked = [c.upper()]
        elif "letters" in resp:
            marked = resp["letters"]
        correct = q.get("correct")
        if correct is None and isinstance(q.get("answer_key"), dict):
            correct = q["answer_key"].get("correct")
        ok, earned, chosen = score_choice(correct, marked, pts)
        total += earned
        rows.append(
            {
                "question_index": i,
                "question_id": q.get("id") or q.get("question_id"),
                "question_version": q.get("version"),
                "response": {"choice": chosen, "letters": marked},
                "is_correct": ok,
                "points": earned,
                "max_points": pts,
            }
        )

    is_late = False
    if assignment.deadline and timezone.now() > assignment.deadline:
        is_late = True
        if not assignment.allow_late:
            raise ValidationError("Muddat o‘tgan — topshirish yopiq.")

    sub.answers.all().delete()
    Answer.objects.bulk_create(
        [
            Answer(
                submission=sub,
                question_index=r["question_index"],
                question_id=r.get("question_id"),
                question_version=r.get("question_version"),
                response=r["response"],
                is_correct=r["is_correct"],
                points=r["points"],
                max_points=r["max_points"],
            )
            for r in rows
        ]
    )
    sub.score = total
    sub.max_score = max_total if max_total else assignment.max_score
    sub.is_late = is_late
    sub.submitted_at = timezone.now()
    sub.graded_at = timezone.now()
    sub.status = Submission.Status.PUBLISHED
    sub.save()
    AuditLog.objects.create(
        actor=student,
        school=assignment.school,
        action="submission.digital_finished",
        object_type="Submission",
        object_id=str(sub.id),
        message=f"Raqamli topshirish: {total}/{sub.max_score}",
    )
    # Differentiators: understanding check + topic mastery
    try:
        from insights.services import (
            maybe_create_understanding_check,
            update_topic_mastery_from_submission,
        )
        maybe_create_understanding_check(sub)
        update_topic_mastery_from_submission(sub)
    except Exception:
        pass
    return sub
