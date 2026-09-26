"""Homework / tests / practical assignments with multi-class targets."""
from django.conf import settings
from django.db import models


class Assignment(models.Model):
    class Kind(models.TextChoices):
        TEST = "test", "Test"
        PRACTICAL = "practical", "Practical"
        MIXED = "mixed", "Mixed"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, related_name="assignments"
    )
    subject = models.ForeignKey(
        "schools.Subject", on_delete=models.PROTECT, related_name="assignments"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_assignments",
    )
    title = models.CharField(max_length=255)
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.TEST)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    lesson_date = models.DateField(null=True, blank=True, db_index=True)
    deadline = models.DateTimeField(null=True, blank=True)
    # Frozen on publish: list of {question_id, version, order, points, snapshot...}
    question_snapshot = models.JSONField(default=list, blank=True)
    rubric = models.JSONField(default=dict, blank=True)
    # practical AI policy: manual | auto_clear
    ai_grade_policy = models.CharField(max_length=32, default="manual")
    max_score = models.DecimalField(max_digits=8, decimal_places=2, default=100)
    allow_late = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-lesson_date", "-created_at"]
        indexes = [
            models.Index(fields=["school", "status", "lesson_date"]),
            models.Index(fields=["subject", "status"]),
        ]

    def __str__(self):
        return f"{self.title} [{self.status}]"


class AssignmentTarget(models.Model):
    """One assignment can target multiple classes."""

    assignment = models.ForeignKey(
        Assignment, on_delete=models.CASCADE, related_name="targets"
    )
    class_group = models.ForeignKey(
        "schools.ClassGroup", on_delete=models.CASCADE, related_name="assignment_targets"
    )

    class Meta:
        unique_together = [("assignment", "class_group")]


class AssignmentAttachment(models.Model):
    assignment = models.ForeignKey(
        Assignment, on_delete=models.CASCADE, related_name="attachments"
    )
    file = models.ForeignKey("files.StoredFile", on_delete=models.CASCADE)
    sort_order = models.PositiveSmallIntegerField(default=0)
