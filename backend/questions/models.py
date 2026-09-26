"""Question bank with immutable versions."""
from django.conf import settings
from django.db import models


class Question(models.Model):
    class Type(models.TextChoices):
        SINGLE = "single", "Single choice"
        MULTI = "multi", "Multiple choice"
        SHORT = "short", "Short answer"
        FILL = "fill", "Fill blanks"
        MATCHING = "matching", "Matching"
        ORDERING = "ordering", "Ordering"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        ARCHIVED = "archived", "Archived"

    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, related_name="questions"
    )
    subject = models.ForeignKey(
        "schools.Subject", on_delete=models.PROTECT, related_name="questions"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_questions",
    )
    qtype = models.CharField(max_length=16, choices=Type.choices)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    grade = models.PositiveSmallIntegerField(null=True, blank=True)
    difficulty = models.PositiveSmallIntegerField(default=1)  # 1-5
    xp = models.PositiveSmallIntegerField(default=10)
    tags = models.JSONField(default=list, blank=True)
    dtm_eligible = models.BooleanField(default=False)
    current_version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["school", "subject", "status"]),
        ]

    def __str__(self):
        return f"Q{self.pk} v{self.current_version} ({self.qtype})"


class QuestionVersion(models.Model):
    """Immutable snapshot of question content + answer key."""

    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="versions"
    )
    version = models.PositiveIntegerField()
    text = models.TextField()
    html = models.TextField(blank=True, default="")
    latex = models.TextField(blank=True, default="")
    # options: list of strings for choice types
    options = models.JSONField(default=list, blank=True)
    # answer key shape depends on qtype — never expose to students
    answer_key = models.JSONField(default=dict)
    explanation = models.TextField(blank=True, default="")
    images = models.JSONField(default=list, blank=True)  # StoredFile ids or URLs
    # short-answer: accepted list of strings; tolerance for numeric
    accepted_answers = models.JSONField(default=list, blank=True)
    numeric_tolerance = models.FloatField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("question", "version")]
        ordering = ["question_id", "version"]

    def __str__(self):
        return f"Q{self.question_id}v{self.version}"
