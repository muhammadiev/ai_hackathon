"""Telegram link, inbound intake, confirm → unified Submission."""
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from accounts.models import TelegramLink, TelegramLinkCode
from telegram_bot.models import TelegramInbound, TelegramChannelSettings
from submissions.models import Submission, SubmissionFile
from schools.models import ClassEnrollment
from audit.models import AuditLog
from files.models import StoredFile


def redeem_link_code(*, code: str, telegram_user_id: int, telegram_username: str = ""):
    code = (code or "").strip().upper()
    if not code:
        raise ValidationError("Kod bo‘sh.")
    row = (
        TelegramLinkCode.objects.select_for_update()
        .filter(code=code)
        .select_related("user")
        .first()
    )
    if not row:
        raise ValidationError("Kod topilmadi.")
    if row.used_at:
        raise ValidationError("Kod allaqachon ishlatilgan.")
    if row.expires_at < timezone.now():
        raise ValidationError("Kod muddati tugagan.")

    # telegram_user_id uniqueness
    existing = TelegramLink.objects.filter(telegram_user_id=telegram_user_id).first()
    if existing and existing.user_id != row.user_id:
        raise ValidationError("Bu Telegram akkaunt boshqa foydalanuvchiga bog‘langan.")

    link, _ = TelegramLink.objects.update_or_create(
        user=row.user,
        defaults={
            "telegram_user_id": telegram_user_id,
            "telegram_username": (telegram_username or "")[:64],
            "is_active": True,
        },
    )
    row.used_at = timezone.now()
    row.save(update_fields=["used_at"])
    return link


def resolve_user_from_telegram(telegram_user_id: int):
    return (
        TelegramLink.objects.filter(
            telegram_user_id=telegram_user_id, is_active=True
        )
        .select_related("user")
        .first()
    )


@transaction.atomic
def ingest_update(update: dict) -> TelegramInbound | None:
    """
    Parse Telegram Bot API update.
    Idempotent on (telegram_user_id, message_id).
    Supports /link CODE and file/text messages.
    """
    message = update.get("message") or update.get("edited_message")
    if not message:
        return None

    from_user = message.get("from") or {}
    tg_uid = from_user.get("id")
    if not tg_uid:
        return None
    msg_id = message.get("message_id")
    if msg_id is None:
        return None

    existing = TelegramInbound.objects.filter(
        telegram_user_id=tg_uid, message_id=msg_id
    ).first()
    if existing:
        return existing

    username = (from_user.get("username") or "")[:64]
    text = (message.get("text") or message.get("caption") or "").strip()
    chat_id = (message.get("chat") or {}).get("id")

    # /link CODE
    if text.upper().startswith("/LINK"):
        parts = text.split(maxsplit=1)
        code = parts[1].strip() if len(parts) > 1 else ""
        try:
            with transaction.atomic():
                link = redeem_link_code(
                    code=code,
                    telegram_user_id=tg_uid,
                    telegram_username=username,
                )
            inbound = TelegramInbound.objects.create(
                telegram_user_id=tg_uid,
                message_id=msg_id,
                chat_id=chat_id,
                telegram_username=username,
                user=link.user,
                status=TelegramInbound.Status.LINKED,
                text=text,
                raw_update=update,
            )
            # school from membership
            mem = link.user.memberships.filter(is_active=True).first()
            if mem:
                inbound.school_id = mem.school_id
                inbound.save(update_fields=["school"])
            return inbound
        except ValidationError:
            inbound = TelegramInbound.objects.create(
                telegram_user_id=tg_uid,
                message_id=msg_id,
                chat_id=chat_id,
                telegram_username=username,
                status=TelegramInbound.Status.IGNORED,
                text=text,
                raw_update=update,
                review_notes="link_failed",
            )
            return inbound

    link = resolve_user_from_telegram(tg_uid)
    user = link.user if link else None
    school_id = None
    if user:
        mem = user.memberships.filter(is_active=True).first()
        if mem:
            school_id = mem.school_id
            settings = TelegramChannelSettings.objects.filter(school_id=school_id).first()
            if settings and not settings.intake_enabled:
                return TelegramInbound.objects.create(
                    telegram_user_id=tg_uid,
                    message_id=msg_id,
                    chat_id=chat_id,
                    telegram_username=username,
                    user=user,
                    school_id=school_id,
                    status=TelegramInbound.Status.IGNORED,
                    text=text,
                    raw_update=update,
                    review_notes="intake_disabled",
                )

    status = (
        TelegramInbound.Status.LINKED if user else TelegramInbound.Status.NEW
    )
    inbound = TelegramInbound.objects.create(
        telegram_user_id=tg_uid,
        message_id=msg_id,
        chat_id=chat_id,
        telegram_username=username,
        user=user,
        school_id=school_id,
        status=status,
        text=text,
        raw_update=update,
        file_ids=[],  # files attached via separate download job / manual
    )
    return inbound


@transaction.atomic
def assign_inbound(*, inbound: TelegramInbound, assignment, actor) -> TelegramInbound:
    if inbound.status == TelegramInbound.Status.CONFIRMED:
        raise ValidationError("Allaqachon tasdiqlangan.")
    if not inbound.user_id:
        raise ValidationError("Avval o‘quvchini bog‘lang.")
    # student must be in target class
    ok = ClassEnrollment.objects.filter(
        student_id=inbound.user_id,
        is_active=True,
        class_group_id__in=assignment.targets.values_list("class_group_id", flat=True),
    ).exists()
    if not ok:
        raise ValidationError("O‘quvchi bu vazifa sinfiga tegishli emas.")
    if assignment.school_id and inbound.school_id and assignment.school_id != inbound.school_id:
        raise ValidationError("Maktab mos emas.")

    inbound.assignment = assignment
    inbound.status = TelegramInbound.Status.ASSIGNED
    inbound.handled_by = actor
    inbound.save(update_fields=["assignment", "status", "handled_by", "updated_at"])
    AuditLog.objects.create(
        actor=actor,
        school=assignment.school,
        action="telegram.assigned",
        object_type="TelegramInbound",
        object_id=str(inbound.id),
        message=f"TG#{inbound.id} → assignment {assignment.id}",
    )
    return inbound


def run_demo_ai_grade(*, inbound: TelegramInbound, scenario: str = "clear") -> TelegramInbound:
    """
    Demo AI only — labels scenario. Real model not called.
    Never sets CONFIRMED; teacher must confirm.
    """
    if not inbound.assignment_id:
        raise ValidationError("Avval vazifa biriktiring.")
    if inbound.status == TelegramInbound.Status.CONFIRMED:
        raise ValidationError("Tasdiqlangan yozuv.")

    settings = None
    if inbound.school_id:
        settings = TelegramChannelSettings.objects.filter(
            school_id=inbound.school_id
        ).first()
    if settings and not settings.ai_grade_enabled:
        raise ValidationError("AI baholash o‘chirilgan.")

    max_score = inbound.assignment.max_score or Decimal("100")
    if scenario == "clear":
        inbound.ai_confidence = "clear"
        inbound.ai_score = (max_score * Decimal("0.85")).quantize(Decimal("0.01"))
        inbound.ai_max_score = max_score
        inbound.ai_feedback = "Demo AI: aniq javob (namuna)."
        inbound.status = TelegramInbound.Status.AI_DONE
    elif scenario == "ambiguous":
        inbound.ai_confidence = "ambiguous"
        inbound.ai_score = None
        inbound.ai_max_score = max_score
        inbound.ai_feedback = "Demo AI: noaniq — o‘qituvchi ko‘rib chiqishi kerak."
        inbound.status = TelegramInbound.Status.NEEDS_REVIEW
    else:
        inbound.ai_confidence = "failed"
        inbound.ai_score = None
        inbound.ai_max_score = max_score
        inbound.ai_feedback = "Demo AI: xizmat xatosi (namuna)."
        inbound.status = TelegramInbound.Status.NEEDS_REVIEW
        inbound.ai_raw = {"error": "demo_service_failure"}

    inbound.ai_raw = {**(inbound.ai_raw or {}), "scenario": scenario, "demo": True}
    inbound.save()
    return inbound


@transaction.atomic
def confirm_inbound_grade(
    *,
    inbound: TelegramInbound,
    actor,
    score: Decimal | None = None,
    max_score: Decimal | None = None,
    publish: bool = True,
) -> Submission:
    """Write into submissions.Submission source=telegram — same table as paper/digital."""
    inbound = (
        TelegramInbound.objects.select_for_update()
        .select_related("assignment", "user")
        .get(pk=inbound.pk)
    )
    if inbound.status == TelegramInbound.Status.CONFIRMED and inbound.submission_id:
        raise ValidationError("Allaqachon tasdiqlangan.")
    if not inbound.user_id:
        raise ValidationError("O‘quvchi bog‘lanmagan.")
    if not inbound.assignment_id:
        raise ValidationError("Vazifa biriktirilmagan.")

    assignment = inbound.assignment
    ok = ClassEnrollment.objects.filter(
        student_id=inbound.user_id,
        is_active=True,
        class_group_id__in=assignment.targets.values_list("class_group_id", flat=True),
    ).exists()
    if not ok:
        raise ValidationError("O‘quvchi bu vazifa sinfiga tegishli emas.")

    existing = (
        Submission.objects.select_for_update()
        .filter(
            student_id=inbound.user_id,
            assignment_id=assignment.id,
            status=Submission.Status.PUBLISHED,
        )
        .first()
    )
    if existing:
        raise ValidationError(
            "Bu o‘quvchi uchun natija allaqachon e’lon qilingan (409)."
        )

    final_score = score if score is not None else inbound.ai_score
    final_max = max_score if max_score is not None else (
        inbound.ai_max_score or assignment.max_score
    )
    if final_score is None:
        raise ValidationError("Baho ko‘rsatilmagan.")

    attempt_no = (
        Submission.objects.filter(
            student_id=inbound.user_id, assignment_id=assignment.id
        ).count()
        + 1
    )
    st = Submission.Status.PUBLISHED if publish else Submission.Status.GRADED
    sub = Submission.objects.create(
        student_id=inbound.user_id,
        assignment=assignment,
        attempt_no=attempt_no,
        source=Submission.Source.TELEGRAM,
        status=st,
        score=final_score,
        max_score=final_max,
        submitted_at=timezone.now(),
        graded_at=timezone.now(),
        graded_by=actor,
        telegram_inbound_id=inbound.id,
        meta={"ai_confidence": inbound.ai_confidence, "demo_ai": bool((inbound.ai_raw or {}).get("demo"))},
    )
    for fid in inbound.file_ids or []:
        if StoredFile.objects.filter(pk=fid).exists():
            SubmissionFile.objects.create(
                submission=sub, file_id=fid, file_type="telegram"
            )

    inbound.status = TelegramInbound.Status.CONFIRMED
    inbound.submission = sub
    inbound.confirmed_at = timezone.now()
    inbound.handled_by = actor
    inbound.save(
        update_fields=[
            "status",
            "submission",
            "confirmed_at",
            "handled_by",
            "updated_at",
        ]
    )
    AuditLog.objects.create(
        actor=actor,
        school=assignment.school,
        action="telegram.confirmed",
        object_type="Submission",
        object_id=str(sub.id),
        message=f"TG#{inbound.id} → sub#{sub.id} score={final_score}/{final_max}",
    )
    
    try:
        from insights.services import (
            maybe_create_understanding_check,
            update_topic_mastery_from_submission,
        )
        maybe_create_understanding_check(sub)
        update_topic_mastery_from_submission(sub)
    except Exception:
        pass
    return sub
