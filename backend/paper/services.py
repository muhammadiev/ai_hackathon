"""
Paper channel business logic.
Confirm is atomic and writes only into submissions.Submission.
"""
from decimal import Decimal
from django.db import transaction, IntegrityError
from django.db.models import Max
from django.utils import timezone
from django.core.exceptions import ValidationError

from paper.models import PaperBatch, PaperSheetStudent, ScanJob
from submissions.models import Submission, Answer
from schools.models import ClassEnrollment
from questions.scoring import score_mcq_snapshot
from audit.models import AuditLog


def next_batch_code(school_id: int) -> str:
    """Allocate next 6-digit code under row lock (call inside atomic + select_for_update)."""
    # Lock existing rows for this school to serialize code allocation
    list(
        PaperBatch.objects.select_for_update()
        .filter(school_id=school_id)
        .values_list("id", flat=True)[:1]
    )
    agg = PaperBatch.objects.filter(school_id=school_id).aggregate(m=Max("code"))
    last = agg.get("m")
    n = int(last) + 1 if last and str(last).isdigit() else 1
    if n > 999999:
        raise ValidationError("Chop etish kodlari limiti tugadi.")
    return f"{n:06d}"


def create_paper_batch(*, assignment, class_group, student_ids, personalized, created_by):
    if assignment.status != "published":
        raise ValidationError("Faqat e’lon qilingan vazifa uchun chop etish mumkin.")
    if assignment.kind not in ("test", "mixed"):
        raise ValidationError("Qog‘oz test faqat test turidagi vazifalar uchun.")
    if assignment.school_id != class_group.school_id:
        raise ValidationError("Sinf va vazifa bir maktabda bo‘lishi kerak.")
    if not assignment.targets.filter(class_group_id=class_group.id).exists():
        raise ValidationError("Bu vazifa ushbu sinfga biriktirilmagan.")

    snapshot = assignment.question_snapshot or []
    if not snapshot:
        raise ValidationError("Savollar snapshot bo‘sh.")

    # Only MCQ-friendly items for paper (options present)
    for i, q in enumerate(snapshot):
        opts = q.get("options") or []
        if len(opts) < 2:
            raise ValidationError(
                f"Savol {i + 1}: qog‘oz test uchun kamida 2 ta variant kerak."
            )

    enrollments = ClassEnrollment.objects.filter(
        class_group=class_group,
        student_id__in=student_ids,
        is_active=True,
    ).select_related("student", "student__profile")
    found_ids = set(enrollments.values_list("student_id", flat=True))
    missing = set(student_ids) - found_ids
    if missing:
        raise ValidationError(
            f"Ba’zi o‘quvchilar sinfda topilmadi: {sorted(missing)[:5]}"
        )
    if not found_ids:
        raise ValidationError("Tanlangan o‘quvchilar topilmadi.")

    batch = None
    last_err = None
    for _attempt in range(5):
        try:
            with transaction.atomic():
                code = next_batch_code(assignment.school_id)
                batch = PaperBatch.objects.create(
                    school=assignment.school,
                    assignment=assignment,
                    class_group=class_group,
                    code=code,
                    personalized=personalized,
                    title=assignment.title,
                    questions=snapshot,
                    created_by=created_by,
                )
            break
        except IntegrityError as e:
            last_err = e
            batch = None
            continue
    if batch is None:
        raise ValidationError(
            "Chop etish kodini ajratib bo‘lmadi (poyga). Qayta urinib ko‘ring."
        ) from last_err

    with transaction.atomic():
        # sheets + audit (batch already created)
        sheets = []
        for en in enrollments:
            name = ""
            if hasattr(en.student, "profile") and en.student.profile:
                name = en.student.profile.full_name or ""
            sheets.append(
                PaperSheetStudent(
                    batch=batch,
                    student=en.student,
                    pupil_code=en.pupil_code,
                    student_name=name or en.student.username,
                )
            )
        PaperSheetStudent.objects.bulk_create(sheets)
        AuditLog.objects.create(
            actor=created_by,
            school=assignment.school,
            action="paper.batch_created",
            object_type="PaperBatch",
            object_id=str(batch.id),
            message=f"Chop to‘plami {code}: {batch.title} ({len(sheets)} o‘quvchi)",
        )
    return batch


@transaction.atomic
def confirm_scan(*, scan: ScanJob, teacher, publish: bool = True) -> Submission:
    """
    Resolve identity, score, write Submission. Reject duplicates / wrong class.
    Uses select_for_update to avoid double-publish races.
    """
    scan = (
        ScanJob.objects.select_for_update()
        .select_related("assignment", "batch", "student")
        .prefetch_related("answers", "assignment__targets")
        .get(pk=scan.pk)
    )

    if scan.status == ScanJob.Status.CONFIRMED and scan.submission_id:
        raise ValidationError("Bu skan allaqachon tasdiqlangan.")

    if not scan.student_id:
        raise ValidationError("O‘quvchi aniqlanmagan.")

    assignment = scan.assignment

    # Student must be in an assignment target class
    in_target = ClassEnrollment.objects.filter(
        student_id=scan.student_id,
        is_active=True,
        class_group_id__in=assignment.targets.values_list("class_group_id", flat=True),
    ).exists()
    if not in_target:
        raise ValidationError("O‘quvchi bu vazifa sinfiga tegishli emas.")

    # If batch present, student must be on the sheet roster
    if scan.batch_id:
        on_sheet = scan.batch.students.filter(student_id=scan.student_id).exists()
        if not on_sheet:
            raise ValidationError("O‘quvchi bu chop to‘plamida yo‘q.")

    unresolved = scan.answers.filter(is_resolved=False).count()
    if unresolved:
        raise ValidationError(
            f"{unresolved} ta savol hali aniq emas. Avval tuzating."
        )

    # Lock against concurrent publish for same student+assignment
    existing = (
        Submission.objects.select_for_update()
        .filter(
            student_id=scan.student_id,
            assignment_id=assignment.id,
            status=Submission.Status.PUBLISHED,
        )
        .first()
    )
    if existing:
        raise ValidationError(
            "Bu o‘quvchi uchun natija allaqachon e’lon qilingan (409)."
        )

    if scan.batch_id:
        questions = scan.batch.questions
    else:
        questions = assignment.question_snapshot or []

    marks = {}
    for a in scan.answers.all():
        final = a.final_mark if a.final_mark is not None else a.marked
        marks[a.question_index] = final

    score, max_score, rows = score_mcq_snapshot(questions, marks)

    attempt_no = (
        Submission.objects.filter(
            student_id=scan.student_id, assignment_id=assignment.id
        ).count()
        + 1
    )

    status = Submission.Status.PUBLISHED if publish else Submission.Status.GRADED
    sub = Submission.objects.create(
        student_id=scan.student_id,
        assignment=assignment,
        attempt_no=attempt_no,
        source=Submission.Source.PAPER,
        status=status,
        score=score,
        max_score=max_score,
        submitted_at=timezone.now(),
        graded_at=timezone.now(),
        graded_by=teacher,
        paper_scan_id=scan.id,
    )
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
    scan.status = ScanJob.Status.CONFIRMED
    scan.submission = sub
    scan.confirmed_at = timezone.now()
    scan.confirmed_by = teacher
    scan.save(
        update_fields=[
            "status",
            "submission",
            "confirmed_at",
            "confirmed_by",
        ]
    )
    AuditLog.objects.create(
        actor=teacher,
        school=assignment.school,
        action="paper.scan_confirmed",
        object_type="Submission",
        object_id=str(sub.id),
        message=(
            f"Skan #{scan.id} → submission #{sub.id} "
            f"score={score}/{max_score} student={scan.student_id}"
        ),
        meta={"scan_id": scan.id, "publish": publish},
    )
    
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
