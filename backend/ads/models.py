"""
Reklama: admin enters a full prompt/brief → AI generates creatives.
Students always see is_advertisement + explicit label.
"""
from django.conf import settings
from django.db import models


class AdPrompt(models.Model):
    class Category(models.TextChoices):
        STUDY_CENTER = "study_center", "Study center"
        ONLINE_COURSE = "online_course", "Online courses"
        INDIVIDUAL = "individual", "Individual training"
        PRIVATE_SCHOOL = "private_school", "Private schools"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        GENERATING = "generating", "Generating"
        GENERATED = "generated", "Generated"
        ARCHIVED = "archived", "Archived"

    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="ad_prompts",
        help_text="Null = platform-wide (superadmin)",
    )
    category = models.CharField(max_length=32, choices=Category.choices)
    title = models.CharField(max_length=200, blank=True, default="")
    # Full brief entered by admin — every field of the offer as free text
    prompt_text = models.TextField(
        help_text="To‘liq brif: nom, narx, manzil, afzalliklar, CTA va h.k."
    )
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="ad_prompts",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title or f"AdPrompt#{self.pk}"


class AdCreative(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        APPROVED = "approved", "Approved"
        LIVE = "live", "Live"
        PAUSED = "paused", "Paused"
        ARCHIVED = "archived", "Archived"

    prompt = models.ForeignKey(
        AdPrompt, on_delete=models.CASCADE, related_name="creatives"
    )
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="ad_creatives",
    )
    category = models.CharField(max_length=32, choices=AdPrompt.Category.choices)
    # Always true for student-facing payload
    is_advertisement = models.BooleanField(default=True)
    label = models.CharField(
        max_length=32, default="Reklama", help_text="Student UI badge text"
    )
    headline = models.CharField(max_length=200)
    body = models.TextField()
    cta_text = models.CharField(max_length=80, default="Batafsil")
    cta_url = models.URLField(blank=True, default="")
    image_prompt = models.TextField(blank=True, default="")
    image_url = models.URLField(blank=True, default="")
    # Targeting (optional)
    min_grade = models.PositiveSmallIntegerField(null=True, blank=True)
    max_grade = models.PositiveSmallIntegerField(null=True, blank=True)
    subject_ids = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True
    )
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    priority = models.PositiveSmallIntegerField(default=100)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="ad_creatives",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_ads",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["priority", "-created_at"]
        indexes = [
            models.Index(fields=["status", "priority"]),
        ]

    def __str__(self):
        return f"{self.headline[:40]} [{self.status}]"


class AdImpression(models.Model):
    creative = models.ForeignKey(
        AdCreative, on_delete=models.CASCADE, related_name="impressions"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ad_impressions",
    )
    clicked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["creative", "created_at"]),
        ]
