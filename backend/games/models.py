"""Game portal handoff sessions and result linkage."""
from django.conf import settings
from django.db import models


class GameSession(models.Model):
    class Intent(models.TextChoices):
        STUDENT_SIMPLE = "student_simple", "Student free play"
        STUDENT_HOMEWORK = "student_homework", "Student homework game"
        TEACHER_CREATE = "teacher_create", "Teacher create game"

    class Status(models.TextChoices):
        ISSUED = "issued", "Issued"
        LAUNCHED = "launched", "Launched"
        COMPLETED = "completed", "Completed"
        EXPIRED = "expired", "Expired"
        REJECTED = "rejected", "Rejected"

    token = models.CharField(max_length=64, unique=True, db_index=True)
    intent = models.CharField(max_length=32, choices=Intent.choices)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.ISSUED, db_index=True
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="game_sessions",
    )
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="game_sessions",
    )
    assignment = models.ForeignKey(
        "assignments.Assignment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="game_sessions",
    )
    # Launch payload snapshot (no answer keys for students)
    payload = models.JSONField(default=dict, blank=True)
    result_payload = models.JSONField(default=dict, blank=True)
    submission = models.OneToOneField(
        "submissions.Submission",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="game_session",
    )
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.token[:8]}… [{self.status}]"
