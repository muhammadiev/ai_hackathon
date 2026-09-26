"""
Unified results: digital, paper, telegram, game all write here.
One published grade per (student, assignment) by default.
"""
from django.conf import settings
from django.db import models


class Submission(models.Model):
    class Source(models.TextChoices):
        DIGITAL = "digital", "Digital"
        PAPER = "paper", "Paper scan"
        TELEGRAM = "telegram", "Telegram"
        GAME = "game", "Game portal"

    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "In progress"
        SUBMITTED = "submitted", "Submitted"
        NEEDS_REVIEW = "needs_review", "Needs review"
        GRADED = "graded", "Graded"
        PUBLISHED = "published", "Published"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    assignment = models.ForeignKey(
        "assignments.Assignment",
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    attempt_no = models.PositiveSmallIntegerField(default=1)
    source = models.CharField(max_length=16, choices=Source.choices, default=Source.DIGITAL)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.IN_PROGRESS, db_index=True
    )
    score = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    max_score = models.DecimalField(max_digits=8, decimal_places=2, default=100)
    is_late = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="graded_submissions",
    )
    # links back to channel records
    paper_scan_id = models.PositiveBigIntegerField(null=True, blank=True)
    telegram_inbound_id = models.PositiveBigIntegerField(null=True, blank=True)
    meta = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = [("student", "assignment", "attempt_no")]
        indexes = [
            models.Index(fields=["assignment", "status"]),
            models.Index(fields=["student", "status"]),
            models.Index(fields=["assignment", "student", "status"]),
        ]
        constraints = [
            # At most one PUBLISHED submission per student+assignment
            models.UniqueConstraint(
                fields=["student", "assignment"],
                condition=models.Q(status="published"),
                name="uniq_published_result_per_student_assignment",
            )
        ]

    def __str__(self):
        return f"{self.student_id} / A{self.assignment_id} #{self.attempt_no} ({self.status})"


class Answer(models.Model):
    submission = models.ForeignKey(
        Submission, on_delete=models.CASCADE, related_name="answers"
    )
    question_index = models.PositiveSmallIntegerField()
    question_id = models.PositiveBigIntegerField(null=True, blank=True)
    question_version = models.PositiveIntegerField(null=True, blank=True)
    # chosen option index / indices / text / structured
    response = models.JSONField(default=dict)
    is_correct = models.BooleanField(null=True, blank=True)
    points = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    max_points = models.DecimalField(max_digits=6, decimal_places=2, default=1)

    class Meta:
        unique_together = [("submission", "question_index")]
        ordering = ["question_index"]


class SubmissionFile(models.Model):
    submission = models.ForeignKey(
        Submission, on_delete=models.CASCADE, related_name="files"
    )
    file = models.ForeignKey("files.StoredFile", on_delete=models.CASCADE)
    file_type = models.CharField(max_length=32, blank=True, default="")
