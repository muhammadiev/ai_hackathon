from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from payments.models import Wallet, LedgerEntry, TopUpCode, CodeRedemption
from audit.models import AuditLog

MIN_TOPUP = Decimal("1000")
MAX_TOPUP = Decimal("1000000")


def get_or_create_wallet(user) -> Wallet:
    w, _ = Wallet.objects.get_or_create(user=user)
    return w


def _q(amount) -> Decimal:
    return Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@transaction.atomic
def credit(*, user, amount, kind, title, reference="", meta=None, actor=None) -> LedgerEntry:
    amount = _q(amount)
    if amount <= 0:
        raise ValidationError("Summa musbat bo‘lishi kerak.")
    wallet = Wallet.objects.select_for_update().get_or_create(user=user)[0]
    # re-fetch locked
    wallet = Wallet.objects.select_for_update().get(pk=wallet.pk)
    wallet.balance = _q(wallet.balance + amount)
    wallet.save(update_fields=["balance", "updated_at"])
    entry = LedgerEntry.objects.create(
        wallet=wallet,
        kind=kind,
        amount=amount,
        balance_after=wallet.balance,
        title=title[:200],
        reference=(reference or "")[:64],
        meta=meta or {},
        created_by=actor or user,
    )
    return entry


@transaction.atomic
def debit(*, user, amount, title, reference="", meta=None, actor=None) -> LedgerEntry:
    amount = _q(amount)
    if amount <= 0:
        raise ValidationError("Summa musbat bo‘lishi kerak.")
    wallet = Wallet.objects.select_for_update().get_or_create(user=user)[0]
    wallet = Wallet.objects.select_for_update().get(pk=wallet.pk)
    if wallet.balance < amount:
        raise ValidationError("Balans yetarli emas.")
    wallet.balance = _q(wallet.balance - amount)
    wallet.save(update_fields=["balance", "updated_at"])
    entry = LedgerEntry.objects.create(
        wallet=wallet,
        kind=LedgerEntry.Kind.SPEND,
        amount=-amount,
        balance_after=wallet.balance,
        title=title[:200],
        reference=(reference or "")[:64],
        meta=meta or {},
        created_by=actor or user,
    )
    return entry


@transaction.atomic
def topup_by_code(*, user, code: str) -> LedgerEntry:
    code = (code or "").strip().upper()
    if not code:
        raise ValidationError("Kod kiriting.")
    row = TopUpCode.objects.select_for_update().filter(code=code).first()
    if not row or not row.is_active:
        raise ValidationError("Kod noto‘g‘ri yoki faol emas.")
    if row.expires_at and row.expires_at < timezone.now():
        raise ValidationError("Kod muddati tugagan.")
    if row.redemption_count >= row.max_redemptions:
        raise ValidationError("Kod limiti tugagan.")
    if CodeRedemption.objects.filter(code=row, user=user).exists():
        raise ValidationError("Siz bu kodni allaqachon ishlatgansiz.")

    entry = credit(
        user=user,
        amount=row.amount,
        kind=LedgerEntry.Kind.TOPUP_CODE,
        title=f"Demo kod: {row.code}",
        reference=row.code,
        meta={"demo": True, "code": row.code},
        actor=user,
    )
    row.redemption_count += 1
    row.save(update_fields=["redemption_count"])
    CodeRedemption.objects.create(code=row, user=user, ledger=entry)
    AuditLog.objects.create(
        actor=user,
        action="wallet.topup_code",
        object_type="LedgerEntry",
        object_id=str(entry.id),
        message=f"+{row.amount} via {row.code}",
    )
    return entry


@transaction.atomic
def topup_by_phone(*, user, phone: str, amount) -> LedgerEntry:
    """
    Simulated phone top-up for UI demo only.
    No SMS, no provider — accepts any non-empty phone-like string.
    """
    phone = (phone or "").strip()
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) < 9:
        raise ValidationError("Telefon raqam noto‘g‘ri (kamida 9 raqam).")
    amount = _q(amount)
    if amount < MIN_TOPUP or amount > MAX_TOPUP:
        raise ValidationError(f"Summa {MIN_TOPUP}–{MAX_TOPUP} oralig‘ida bo‘lsin.")

    # Soft rate limit: max 5 phone topups per user per day
    from datetime import timedelta

    since = timezone.now() - timedelta(hours=24)
    recent = LedgerEntry.objects.filter(
        wallet__user=user,
        kind=LedgerEntry.Kind.TOPUP_PHONE,
        created_at__gte=since,
    ).count()
    if recent >= 5:
        raise ValidationError("Kunlik demo to‘ldirish limiti (5).")

    entry = credit(
        user=user,
        amount=amount,
        kind=LedgerEntry.Kind.TOPUP_PHONE,
        title=f"Demo telefon to‘ldirish ({digits[-4:]})",
        reference=f"phone:{digits[-9:]}",
        meta={"demo": True, "phone_masked": f"***{digits[-4:]}", "provider": "none"},
        actor=user,
    )
    AuditLog.objects.create(
        actor=user,
        action="wallet.topup_phone",
        object_type="LedgerEntry",
        object_id=str(entry.id),
        message=f"+{amount} demo phone",
    )
    return entry
