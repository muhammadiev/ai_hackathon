"""
Identity: User, Profile, SchoolMembership, TelegramLink.
Roles live on membership (per school), not only on User.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Platform login identity. No open registration."""

    class GlobalRole(models.TextChoices):
        STUDENT = "student", "Student"
        TEACHER = "teacher", "Teacher"
        ADMIN = "admin", "School admin"
        SUPERADMIN = "superadmin", "Super admin"

    # Primary role hint; authoritative scope is SchoolMembership
    global_role = models.CharField(
        max_length=20,
        choices=GlobalRole.choices,
        default=GlobalRole.STUDENT,
        db_index=True,
    )
    phone = models.CharField(max_length=32, blank=True, default="")
    must_change_password = models.BooleanField(default=False)

    class Meta:
        ordering = ["username"]

    def __str__(self):
        return self.username


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=200, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    language = models.CharField(
        max_length=5,
        choices=[("uz", "O‘zbek"), ("ru", "Русский"), ("en", "English")],
        default="uz",
    )
    theme = models.CharField(
        max_length=10,
        choices=[("light", "Light"), ("dark", "Dark"), ("system", "System")],
        default="system",
    )
    privacy_hide_phone = models.BooleanField(default=True)
    privacy_hide_email = models.BooleanField(default=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name or self.user.username


class SchoolMembership(models.Model):
    """User belongs to a school with a role for an academic year."""

    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        TEACHER = "teacher", "Teacher"
        ADMIN = "admin", "Admin"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, related_name="memberships"
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.CharField(max_length=20, choices=Role.choices, db_index=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "school", "academic_year", "role")]
        indexes = [
            models.Index(fields=["school", "role", "is_active"]),
        ]

    def __str__(self):
        return f"{self.user} @ {self.school} ({self.role})"


class TelegramLink(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="telegram_link"
    )
    telegram_user_id = models.BigIntegerField(unique=True)
    telegram_username = models.CharField(max_length=64, blank=True, default="")
    linked_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user} ↔ tg:{self.telegram_user_id}"


class TelegramLinkCode(models.Model):
    """Short-lived code for student to bind Telegram account."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tg_codes")
    code = models.CharField(max_length=8, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.code
