"""
School, academic year, class, subject, enrollments, teacher assignments.
"""
from django.conf import settings
from django.db import models


class School(models.Model):
    name = models.CharField(max_length=200)
    code = models.SlugField(max_length=32, unique=True)
    timezone = models.CharField(max_length=64, default="Asia/Tashkent")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class AcademicYear(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="years")
    label = models.CharField(max_length=32)  # e.g. 2025-2026
    starts_on = models.DateField()
    ends_on = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        unique_together = [("school", "label")]
        ordering = ["-starts_on"]

    def __str__(self):
        return f"{self.school.code} {self.label}"


class Subject(models.Model):
    """Global or school-scoped subject catalog."""

    school = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name="subjects", null=True, blank=True
    )
    code = models.SlugField(max_length=32)
    name = models.CharField(max_length=120)
    name_ru = models.CharField(max_length=120, blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = [("school", "code")]
        ordering = ["name"]

    def __str__(self):
        return self.name


class ClassGroup(models.Model):
    """A class like 7-A within a school/year."""

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name="classes")
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name="classes"
    )
    name = models.CharField(max_length=32)  # 7-A
    grade = models.PositiveSmallIntegerField()  # 5..11
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = [("school", "academic_year", "name")]
        ordering = ["grade", "name"]
        verbose_name = "class"
        verbose_name_plural = "classes"

    def __str__(self):
        return f"{self.name} ({self.school.code})"


class ClassSubject(models.Model):
    """Which subjects are taught in a class."""

    class_group = models.ForeignKey(
        ClassGroup, on_delete=models.CASCADE, related_name="class_subjects"
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = [("class_group", "subject")]


class ClassEnrollment(models.Model):
    """Student in a class for a year."""

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="enrollments",
        limit_choices_to={"global_role": "student"},
    )
    class_group = models.ForeignKey(
        ClassGroup, on_delete=models.CASCADE, related_name="enrollments"
    )
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    pupil_code = models.CharField(
        max_length=6,
        help_text="6-digit code for paper answer sheets",
        db_index=True,
    )
    is_active = models.BooleanField(default=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [
            ("student", "academic_year"),
            ("class_group", "pupil_code"),
        ]
        indexes = [
            models.Index(fields=["class_group", "is_active"]),
        ]

    def __str__(self):
        return f"{self.student} in {self.class_group}"


class TeacherAssignment(models.Model):
    """Teacher may only write to these class+subject pairs."""

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teacher_assignments",
        limit_choices_to={"global_role__in": ["teacher", "admin"]},
    )
    class_group = models.ForeignKey(
        ClassGroup, on_delete=models.CASCADE, related_name="teacher_assignments"
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = [("teacher", "class_group", "subject", "academic_year")]
        indexes = [
            models.Index(fields=["teacher", "is_active"]),
        ]

    def __str__(self):
        return f"{self.teacher} → {self.class_group} / {self.subject}"
