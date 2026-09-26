"""Unified file entity — single representation for all uploads."""
from django.conf import settings
from django.db import models


class StoredFile(models.Model):
    class Status(models.TextChoices):
        UPLOADING = "uploading", "Uploading"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"
        DELETED = "deleted", "Deleted"

    class Kind(models.TextChoices):
        ATTACHMENT = "attachment", "Attachment"
        QUESTION_IMAGE = "question_image", "Question image"
        SCAN = "scan", "Paper scan"
        PRACTICAL = "practical", "Practical work"
        MATERIAL = "material", "Teaching material"
        AVATAR = "avatar", "Avatar"
        OTHER = "other", "Other"

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_files",
    )
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="files",
    )
    kind = models.CharField(max_length=32, choices=Kind.choices, default=Kind.OTHER)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.UPLOADING
    )
    file = models.FileField(upload_to="uploads/%Y/%m/")
    original_name = models.CharField(max_length=255, blank=True, default="")
    content_type = models.CharField(max_length=128, blank=True, default="")
    size_bytes = models.PositiveBigIntegerField(default=0)
    checksum_sha256 = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    finalized_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.original_name or f"file-{self.pk}"
