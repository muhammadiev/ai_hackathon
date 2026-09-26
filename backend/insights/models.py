"""
Differentiators:
1. Understanding Check — post high-score micro-question
2. Effectiveness — before/after + simple A/B reports
3. Parent weekly tip — concrete 5-minute action
4. Topic mastery — knowledge tracking probabilities
5. Offline sync — client queue of answers
6. Creator teacher — content reuse rewards
"""
from django.conf import settings
from django.db import models


class UnderstandingCheck(models.Model):
    """Triggered when student scores >= threshold on a submission."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        ANSWERED = "answered", "Answered"
        EXPIRED = "expired", "Expired"
        SKIPPED = "skipped", "Skipped"

    class Outcome(models.TextChoices):
        PASS = "pass", "Understood"
        FAIL = "fail", "Could not answer"
        UNCLEAR = "unclear", "Unclear"
        EXPIRED = "expired", "Expired without answer"

    submission = models.ForeignKey(
        "submissions.Submission",
        on_delete=models.CASCADE,
        related_name="understanding_checks",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="understanding_checks",
    )
    assignment = models.ForeignKey(
        "assignments.Assignment",
        on_delete=models.CASCADE,
        related_name="understanding_checks",
    )
    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, related_name="understanding_checks"
    )
    # Micro-question (rephrased)
    prompt_text = models.TextField()
    prompt_meta = models.JSONField(default=dict, blank=True)
    expected_hint = models.TextField(blank=True, default="")  # teacher-only
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    student_answer = models.TextField(blank=True, default="")
    outcome = models.CharField(
        max_length=16, choices=Outcome.choices, blank=True, default=""
    )
    flag_teacher = models.BooleanField(
        default=False, help_text="True if fail → likely assisted"
    )
    teacher_note = models.TextField(blank=True, default="")
    # Timing: 30 second window (configurable)
    window_seconds = models.PositiveIntegerField(default=30)
    sent_at = models.DateTimeField(null=True, blank=True)
    answered_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["student", "status"]),
            models.Index(fields=["school", "flag_teacher"]),
        ]

    def __str__(self):
        return f"UC#{self.pk} sub={self.submission_id} [{self.status}]"


class TopicMastery(models.Model):
    """P(student truly knows topic) — updated after each graded work."""

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="topic_mastery"
    )
    school = models.ForeignKey("schools.School", on_delete=models.CASCADE)
    subject = models.ForeignKey(
        "schools.Subject", on_delete=models.CASCADE, related_name="mastery_rows"
    )
    topic_key = models.CharField(max_length=120, db_index=True)
    topic_label = models.CharField(max_length=200, blank=True, default="")
    # Probability 0..1
    p_know = models.DecimalField(max_digits=5, decimal_places=4, default=0.3)
    attempts = models.PositiveIntegerField(default=0)
    correct = models.PositiveIntegerField(default=0)
    last_result = models.CharField(max_length=16, blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("student", "subject", "topic_key")]
        ordering = ["topic_key"]

    def __str__(self):
        return f"{self.student_id}:{self.topic_key}={self.p_know}"


class BaselineSnapshot(models.Model):
    """School/class performance snapshot for before/after effectiveness."""

    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, related_name="baselines"
    )
    class_group = models.ForeignKey(
        "schools.ClassGroup",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="baselines",
    )
    label = models.CharField(max_length=80)  # e.g. "2025-09 before", "week-12"
    period_start = models.DateField()
    period_end = models.DateField()
    metrics = models.JSONField(
        default=dict,
        help_text="avg_score, completion_rate, students_count, by_subject, ...",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-period_end"]


class EffectivenessReport(models.Model):
    class Kind(models.TextChoices):
        BEFORE_AFTER = "before_after", "Before / After"
        AB = "ab", "A/B classes"
        WEEKLY = "weekly", "Weekly digest"

    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, related_name="effectiveness_reports"
    )
    kind = models.CharField(max_length=16, choices=Kind.choices)
    title = models.CharField(max_length=200)
    # Optional A/B class groups
    class_a = models.ForeignKey(
        "schools.ClassGroup",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports_as_a",
    )
    class_b = models.ForeignKey(
        "schools.ClassGroup",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports_as_b",
    )
    baseline = models.ForeignKey(
        BaselineSnapshot,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports",
    )
    summary = models.JSONField(default=dict)
    narrative = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class ParentLink(models.Model):
    """Parent linked to a student (Telegram or phone)."""

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="parent_links",
    )
    parent_name = models.CharField(max_length=120, blank=True, default="")
    parent_phone = models.CharField(max_length=32, blank=True, default="")
    telegram_user_id = models.BigIntegerField(null=True, blank=True, db_index=True)
    telegram_username = models.CharField(max_length=64, blank=True, default="")
    is_active = models.BooleanField(default=True)
    weekly_tips_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["student", "is_active"])]


class ParentWeeklyTip(models.Model):
    """One concrete 5-minute action for a parent."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        QUEUED = "queued", "Queued"
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"

    parent_link = models.ForeignKey(
        ParentLink, on_delete=models.CASCADE, related_name="tips"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="parent_tips"
    )
    school = models.ForeignKey("schools.School", on_delete=models.CASCADE)
    week_key = models.CharField(max_length=16, db_index=True)  # 2026-W12
    title = models.CharField(max_length=200)
    body = models.TextField()  # includes the exact question/action
    topic_key = models.CharField(max_length=120, blank=True, default="")
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("parent_link", "week_key")]
        ordering = ["-created_at"]


class OfflineSyncBatch(models.Model):
    """Student device uploads answers collected offline (PWA)."""

    class Status(models.TextChoices):
        RECEIVED = "received", "Received"
        APPLIED = "applied", "Applied"
        PARTIAL = "partial", "Partial"
        REJECTED = "rejected", "Rejected"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="offline_syncs"
    )
    client_batch_id = models.CharField(max_length=64, db_index=True)
    payload = models.JSONField(default=dict)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.RECEIVED
    )
    result = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("student", "client_batch_id")]


class CreatorReward(models.Model):
    """Points / status when a teacher's question is reused."""

    class Kind(models.TextChoices):
        REUSE = "reuse", "Content reused"
        FEATURED = "featured", "Featured"
        BONUS = "bonus", "Bonus"

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="creator_rewards"
    )
    question = models.ForeignKey(
        "questions.Question",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="creator_rewards",
    )
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.REUSE)
    points = models.PositiveIntegerField(default=10)
    note = models.CharField(max_length=200, blank=True, default="")
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class CreatorBalance(models.Model):
    teacher = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="creator_balance",
    )
    points = models.PositiveIntegerField(default=0)
    reuse_count = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
