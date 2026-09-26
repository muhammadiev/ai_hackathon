"""
Simple demo wallet — no real payment providers.
Top-up by promo code or phone confirmation (simulated).
Ledger is append-only.
"""
from django.conf import settings
from django.db import models


class Wallet(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wallet"
    )
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    currency = models.CharField(max_length=8, default="UZS")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user_id}: {self.balance} {self.currency}"


class LedgerEntry(models.Model):
    """Immutable money movement. Never update amount — reverse with new row."""

    class Kind(models.TextChoices):
        TOPUP_CODE = "topup_code", "Top-up by code"
        TOPUP_PHONE = "topup_phone", "Top-up by phone (demo)"
        SPEND = "spend", "Spend"
        REFUND = "refund", "Refund"
        ADJUST = "adjust", "Admin adjust"

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="ledger")
    kind = models.CharField(max_length=16, choices=Kind.choices)
    amount = models.DecimalField(
        max_digits=14, decimal_places=2, help_text="Positive = credit, negative = debit"
    )
    balance_after = models.DecimalField(max_digits=14, decimal_places=2)
    title = models.CharField(max_length=200)
    reference = models.CharField(max_length=64, blank=True, default="", db_index=True)
    meta = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_actions",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["wallet", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.kind} {self.amount} → {self.balance_after}"


class TopUpCode(models.Model):
    """Demo promo codes — for show only, not real money."""

    code = models.CharField(max_length=32, unique=True, db_index=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    max_redemptions = models.PositiveIntegerField(default=1)
    redemption_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    note = models.CharField(max_length=200, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.code} = {self.amount}"


class CodeRedemption(models.Model):
    code = models.ForeignKey(TopUpCode, on_delete=models.CASCADE, related_name="redemptions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    ledger = models.ForeignKey(LedgerEntry, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("code", "user")]
