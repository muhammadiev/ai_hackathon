from django.conf import settings
from django.db import models


class SupportMessage(models.Model):
    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, null=True, blank=True, related_name="support_messages"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="support_messages"
    )
    body = models.TextField()
    is_from_staff = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class SchoolContact(models.Model):
    school = models.OneToOneField(
        "schools.School", on_delete=models.CASCADE, related_name="contacts"
    )
    telegram = models.CharField(max_length=120, blank=True, default="")
    instagram = models.CharField(max_length=120, blank=True, default="")
    facebook = models.CharField(max_length=120, blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")
