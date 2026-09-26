"""
Digital Twin + Acceleration Packs + parent investment + teacher revenue share.
All probability fields are ranges — never a bare single number.
Payments use demo wallet (no real Click) until production provider is wired.
"""
from django.conf import settings
from django.db import models


class StudentTwin(models.Model):
    student = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="twin"
    )
    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, related_name="twins"
    )
    # Ranges only
    score_low = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    score_high = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    probability_low = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    probability_high = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    top_direction = models.CharField(max_length=120, blank=True, default="")
    methodology_note = models.CharField(
        max_length=300,
        default="So‘nggi yillar ma’lumotlari asosida diapazon; kafolat emas.",
    )
    last_recomputed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def midpoint_probability(self):
        return (self.probability_low + self.probability_high) / 2

    def __str__(self):
        return f"Twin({self.student_id})"


class TwinSnapshot(models.Model):
    class Trigger(models.TextChoices):
        WEEKLY = "weekly", "Weekly"
        POST_DTM = "post_dtm_attempt", "Post DTM"
        POST_PACK = "post_pack_completion", "Post pack"
        MANUAL = "manual", "Manual"
        INITIAL = "initial", "Initial"

    twin = models.ForeignKey(
        StudentTwin, on_delete=models.CASCADE, related_name="snapshots"
    )
    computed_at = models.DateTimeField(auto_now_add=True)
    score_low = models.DecimalField(max_digits=6, decimal_places=2)
    score_high = models.DecimalField(max_digits=6, decimal_places=2)
    probability_low = models.DecimalField(max_digits=5, decimal_places=2)
    probability_high = models.DecimalField(max_digits=5, decimal_places=2)
    direction = models.CharField(max_length=120, blank=True, default="")
    trigger = models.CharField(max_length=32, choices=Trigger.choices)
    meta = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["computed_at"]


class AccelerationPack(models.Model):
    class Status(models.TextChoices):
        PROPOSED = "proposed", "Proposed"
        PURCHASED = "purchased", "Purchased"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    class PayerType(models.TextChoices):
        STUDENT = "student", "Student"
        PARENT = "parent", "Parent"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="acceleration_packs",
    )
    school = models.ForeignKey("schools.School", on_delete=models.CASCADE)
    generated_from_snapshot = models.ForeignKey(
        TwinSnapshot,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="packs",
    )
    target_topics = models.JSONField(default=list)  # [{key, label, p_know}]
    duration_weeks = models.PositiveSmallIntegerField(default=4)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=99000)
    # Probability ranges (never single)
    probability_before_low = models.DecimalField(max_digits=5, decimal_places=2)
    probability_before_high = models.DecimalField(max_digits=5, decimal_places=2)
    probability_after_low = models.DecimalField(max_digits=5, decimal_places=2)
    probability_after_high = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.PROPOSED, db_index=True
    )
    disclaimer = models.TextField(
        default=(
            "Natija kafolatlanmaydi — faqat ehtimol diapazoni o‘zgarishi mumkin. "
            "Ko‘rsatilgan raqamlar metodologiya va tarixiy ma’lumotlarga asoslangan."
        )
    )
    purchased_by_type = models.CharField(
        max_length=16, choices=PayerType.choices, blank=True, default=""
    )
    purchased_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pack_purchases",
    )
    parent_link = models.ForeignKey(
        "insights.ParentLink",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pack_purchases",
    )
    ledger_entry = models.ForeignKey(
        "payments.LedgerEntry",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acceleration_packs",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    purchased_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Pack#{self.pk} {self.student_id} [{self.status}]"


class ParentPurchase(models.Model):
    parent_link = models.ForeignKey(
        "insights.ParentLink", on_delete=models.CASCADE, related_name="purchases"
    )
    pack = models.ForeignKey(
        AccelerationPack, on_delete=models.CASCADE, related_name="parent_purchases"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=16, default="completed")
    ledger_entry = models.ForeignKey(
        "payments.LedgerEntry",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)


class TeacherRevenueShareRule(models.Model):
    category = models.CharField(max_length=40, default="acceleration_pack", unique=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)


class RevenueShareEvent(models.Model):
    pack = models.ForeignKey(
        AccelerationPack, on_delete=models.CASCADE, related_name="revenue_events"
    )
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="revenue_share_events",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    ledger_entry = models.ForeignKey(
        "payments.LedgerEntry",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
