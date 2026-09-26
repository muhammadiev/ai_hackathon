"""School / teacher scope helpers — never trust client schoolId."""
from django.db.models import Q
from schools.models import TeacherAssignment, ClassGroup
from config.exceptions import ForbiddenScopeError


def active_school_ids(user):
    return list(
        user.memberships.filter(is_active=True).values_list("school_id", flat=True)
    )


def teacher_class_ids(user):
    if user.global_role in ("admin", "superadmin"):
        sids = active_school_ids(user)
        return list(
            ClassGroup.objects.filter(school_id__in=sids, is_active=True).values_list(
                "id", flat=True
            )
        )
    return list(
        TeacherAssignment.objects.filter(teacher=user, is_active=True).values_list(
            "class_group_id", flat=True
        )
    )


def teacher_subject_ids(user):
    if user.global_role in ("admin", "superadmin"):
        return None  # all subjects in school
    return list(
        TeacherAssignment.objects.filter(teacher=user, is_active=True)
        .values_list("subject_id", flat=True)
        .distinct()
    )


def assert_teacher_can_access_class(user, class_group_id: int):
    allowed = teacher_class_ids(user)
    if int(class_group_id) not in {int(x) for x in allowed}:
        raise ForbiddenScopeError("Bu sinfga ruxsat yo‘q.")


def assert_teacher_can_access_assignment(user, assignment):
    if user.global_role == "superadmin":
        return
    sids = active_school_ids(user)
    if assignment.school_id not in sids:
        raise ForbiddenScopeError("Bu maktabga ruxsat yo‘q.")
    if user.global_role == "admin":
        return
    # teacher: must have assignment to at least one target class + subject
    target_class_ids = set(
        assignment.targets.values_list("class_group_id", flat=True)
    )
    allowed = set(teacher_class_ids(user))
    if not target_class_ids.intersection(allowed):
        raise ForbiddenScopeError("Bu vazifaga ruxsat yo‘q.")
    subj_ids = teacher_subject_ids(user)
    if subj_ids is not None and assignment.subject_id not in subj_ids:
        raise ForbiddenScopeError("Bu fanga ruxsat yo‘q.")


def student_class_enrollment(user):
    """Active enrollment for student (one class per year)."""
    return (
        user.enrollments.filter(is_active=True)
        .select_related("class_group", "academic_year")
        .first()
    )
