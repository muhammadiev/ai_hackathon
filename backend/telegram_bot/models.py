"""Telegram inbound messages and channel settings."""
from django.conf import settings
from django.db import models


class TelegramChannelSettings(models.Model):
    """Per-school toggles for Telegram intake / AI demo grading."""

    school = models.OneToOneField(
        "schools.School", on_delete=models.CASCADE, related_name="telegram_settings"
    )
    intake_enabled = models.BooleanField(default=True)
    ai_grade_enabled = models.BooleanField(default=False)
    bot_username = models.CharField(max_length=64, blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"TG settings {self.school_id}"


class TelegramInbound(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New"
        LINKED = "linked", "User linked"
        ASSIGNED = "assigned", "Assignment assigned"
        AI_QUEUED = "ai_queued", "AI queued"
        AI_DONE = "ai_done", "AI done"
        NEEDS_REVIEW = "needs_review", "Needs review"
        CONFIRMED = "confirmed", "Confirmed"
        REJECTED = "rejected", "Rejected"
        IGNORED = "ignored", "Ignored"

    # Idempotency: telegram_user_id + message_id
    telegram_user_id = models.BigIntegerField(db_index=True)
    message_id = models.BigIntegerField()
    chat_id = models.BigIntegerField(null=True, blank=True)
    telegram_username = models.CharField(max_length=64, blank=True, default="")

    school = models.ForeignKey(
        "schools.School",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="telegram_inbounds",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="telegram_inbounds",
    )
    assignment = models.ForeignKey(
        "assignments.Assignment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="telegram_inbounds",
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.NEW, db_index=True
    )
    text = models.TextField(blank=True, default="")
    # list of StoredFile ids
    file_ids = models.JSONField(default=list, blank=True)
    raw_update = models.JSONField(default=dict, blank=True)

    # AI grading (never fabricate scores on real work without review unless policy says)
    ai_score = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    ai_max_score = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    ai_feedback = models.TextField(blank=True, default="")
    ai_confidence = models.CharField(
        max_length=16, blank=True, default=""
    )  # clear | ambiguous | failed
    ai_raw = models.JSONField(default=dict, blank=True)

    submission = models.OneToOneField(
        "submissions.Submission",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="telegram_inbound",
    )
    review_notes = models.TextField(blank=True, default="")
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="handled_telegram",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [("telegram_user_id", "message_id")]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "school"]),
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self):
        return f"TG msg {self.message_id} [{self.status}]"
