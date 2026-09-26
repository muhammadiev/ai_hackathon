"""
Demo AI generation from prompt brief.
No external LLM call — structured templates from category + prompt text.
Replace generate_creatives_from_prompt body with real provider later.
"""
from django.db import transaction
from django.db.models import Q
from django.core.exceptions import ValidationError
from django.utils import timezone

from ads.models import AdPrompt, AdCreative
from audit.models import AuditLog


CATEGORY_HINTS = {
    AdPrompt.Category.STUDY_CENTER: {
        "headline": "O‘quv markazi — natijaga yo‘naltirilgan darslar",
        "cta": "Markazga yozilish",
    },
    AdPrompt.Category.ONLINE_COURSE: {
        "headline": "Onlayn kurs — istalgan joydan o‘rganing",
        "cta": "Kursni ko‘rish",
    },
    AdPrompt.Category.INDIVIDUAL: {
        "headline": "Individual mashg‘ulot — shaxsiy yondashuv",
        "cta": "Dars band qilish",
    },
    AdPrompt.Category.PRIVATE_SCHOOL: {
        "headline": "Xususiy maktab — sifatli ta’lim",
        "cta": "Ma’lumot olish",
    },
    AdPrompt.Category.OTHER: {
        "headline": "Maxsus taklif",
        "cta": "Batafsil",
    },
}


def _snippet(text: str, n: int = 280) -> str:
    t = (text or "").strip()
    if len(t) <= n:
        return t
    return t[: n - 1].rstrip() + "…"


@transaction.atomic
def generate_creatives_from_prompt(*, prompt: AdPrompt, actor, variants: int = 2):
    if prompt.status == AdPrompt.Status.ARCHIVED:
        raise ValidationError("Arxivdagi prompt dan generatsiya qilib bo‘lmaydi.")
    if not (prompt.prompt_text or "").strip():
        raise ValidationError("Prompt matni bo‘sh.")

    prompt.status = AdPrompt.Status.GENERATING
    prompt.save(update_fields=["status", "updated_at"])

    hint = CATEGORY_HINTS.get(prompt.category, CATEGORY_HINTS[AdPrompt.Category.OTHER])
    base_title = prompt.title.strip() or hint["headline"]
    body_core = _snippet(prompt.prompt_text, 400)

    created = []
    for i in range(max(1, min(variants, 5))):
        suffix = f" (variant {i + 1})" if variants > 1 else ""
        creative = AdCreative.objects.create(
            prompt=prompt,
            school=prompt.school,
            category=prompt.category,
            is_advertisement=True,
            label="Reklama",
            headline=f"{base_title}{suffix}"[:200],
            body=(
                f"{body_core}\n\n"
                f"— Bu reklama materialidir. Mirae Maktab platformasidagi tijoriy e’lon."
            ),
            cta_text=hint["cta"][:80],
            cta_url="",
            image_prompt=(
                f"Educational ad illustration for {prompt.category}, "
                f"clean modern style, no text overlay: {base_title}"
            )[:500],
            status=AdCreative.Status.DRAFT,
            priority=100 + i,
            created_by=actor,
        )
        created.append(creative)

    prompt.status = AdPrompt.Status.GENERATED
    if not prompt.title:
        prompt.title = base_title[:200]
    prompt.save(update_fields=["status", "title", "updated_at"])

    AuditLog.objects.create(
        actor=actor,
        school=prompt.school,
        action="ads.generated",
        object_type="AdPrompt",
        object_id=str(prompt.id),
        message=f"Prompt#{prompt.id} → {len(created)} creative(s)",
    )
    return created


@transaction.atomic
def set_creative_status(*, creative: AdCreative, status: str, actor) -> AdCreative:
    allowed = {c[0] for c in AdCreative.Status.choices}
    if status not in allowed:
        raise ValidationError(f"Noto‘g‘ri status: {status}")
    if status == AdCreative.Status.LIVE and creative.status == AdCreative.Status.DRAFT:
        creative.approved_by = actor
    if status == AdCreative.Status.APPROVED:
        creative.approved_by = actor
    creative.status = status
    if status == AdCreative.Status.LIVE and not creative.starts_at:
        creative.starts_at = timezone.now()
    creative.is_advertisement = True
    if not creative.label:
        creative.label = "Reklama"
    creative.save()
    AuditLog.objects.create(
        actor=actor,
        school=creative.school,
        action="ads.status",
        object_type="AdCreative",
        object_id=str(creative.id),
        message=f"Ad#{creative.id} → {status}",
    )
    return creative


def active_ads_for_user(user, *, limit: int = 10):
    """Student-facing live ads with optional grade targeting."""
    now = timezone.now()
    qs = AdCreative.objects.filter(status=AdCreative.Status.LIVE).filter(
        Q(starts_at__isnull=True) | Q(starts_at__lte=now),
        Q(ends_at__isnull=True) | Q(ends_at__gte=now),
    )
    from accounts.scoping import active_school_ids

    sids = active_school_ids(user)
    if sids:
        qs = qs.filter(Q(school__isnull=True) | Q(school_id__in=sids))
    else:
        qs = qs.filter(school__isnull=True)

    grade = None
    row = (
        user.enrollments.filter(is_active=True)
        .select_related("class_group")
        .first()
    )
    if row:
        grade = row.class_group.grade
    if grade is not None:
        qs = qs.filter(
            Q(min_grade__isnull=True) | Q(min_grade__lte=grade),
            Q(max_grade__isnull=True) | Q(max_grade__gte=grade),
        )
    return list(qs.order_by("priority", "-created_at")[:limit])
