from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from assignments.models import Assignment, AssignmentTarget
from schools.models import Subject, ClassGroup
from audit.models import AuditLog


def validate_snapshot_for_publish(snapshot: list, kind: str):
    if kind in ("test", "mixed") and not snapshot:
        raise ValidationError("E’lon qilish uchun kamida bitta savol kerak.")
    for i, q in enumerate(snapshot or []):
        if not (q.get("text") or q.get("html")):
            raise ValidationError(f"Savol {i + 1}: matn bo‘sh.")
        opts = q.get("options") or []
        qtype = q.get("qtype") or q.get("type") or "single"
        if qtype in ("single", "multi", None) and kind != "practical":
            if len(opts) < 2:
                raise ValidationError(f"Savol {i + 1}: kamida 2 variant.")
            correct = q.get("correct")
            if correct is None and isinstance(q.get("answer_key"), dict):
                correct = q["answer_key"].get("correct")
            if correct is None:
                raise ValidationError(f"Savol {i + 1}: to‘g‘ri javob ko‘rsatilmagan.")


@transaction.atomic
def create_assignment(*, school, created_by, data: dict) -> Assignment:
    subject = Subject.objects.get(pk=data["subject_id"])
    classes = list(
        ClassGroup.objects.filter(
            id__in=data["class_group_ids"], school=school, is_active=True
        )
    )
    if len(classes) != len(set(data["class_group_ids"])):
        raise ValidationError("Ba’zi sinflar topilmadi yoki boshqa maktabda.")

    asg = Assignment.objects.create(
        school=school,
        subject=subject,
        created_by=created_by,
        title=data["title"].strip(),
        kind=data.get("kind", "test"),
        status=Assignment.Status.DRAFT,
        lesson_date=data.get("lesson_date"),
        deadline=data.get("deadline"),
        question_snapshot=data.get("question_snapshot") or [],
        rubric=data.get("rubric") or {},
        max_score=data.get("max_score") or 100,
        allow_late=data.get("allow_late", True),
        ai_grade_policy=data.get("ai_grade_policy") or "manual",
    )
    AssignmentTarget.objects.bulk_create(
        [AssignmentTarget(assignment=asg, class_group=c) for c in classes]
    )
    AuditLog.objects.create(
        actor=created_by,
        school=school,
        action="assignment.created",
        object_type="Assignment",
        object_id=str(asg.id),
        message=f"Qoralama: {asg.title}",
    )
    return asg


@transaction.atomic
def publish_assignment(*, assignment: Assignment, actor) -> Assignment:
    if assignment.status == Assignment.Status.PUBLISHED:
        raise ValidationError("Allaqachon e’lon qilingan.")
    if not assignment.targets.exists():
        raise ValidationError("Kamida bitta sinf biriktirilishi kerak.")
    validate_snapshot_for_publish(assignment.question_snapshot, assignment.kind)
    assignment.status = Assignment.Status.PUBLISHED
    assignment.published_at = timezone.now()
    assignment.save(update_fields=["status", "published_at", "updated_at"])
    AuditLog.objects.create(
        actor=actor,
        school=assignment.school,
        action="assignment.published",
        object_type="Assignment",
        object_id=str(assignment.id),
        message=f"E’lon: {assignment.title}",
    )
    return assignment
