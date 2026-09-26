from django.conf import settings
from django.db import models


class Course(models.Model):
    school = models.ForeignKey("schools.School", on_delete=models.CASCADE, related_name="courses")
    subject = models.ForeignKey("schools.Subject", on_delete=models.CASCADE, related_name="courses")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    grade = models.PositiveSmallIntegerField(null=True, blank=True)
    is_published = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["subject_id", "title"]

    def __str__(self):
        return self.title


class Topic(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="topics")
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)
    summary = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title


class Video(models.Model):
    school = models.ForeignKey("schools.School", on_delete=models.CASCADE, related_name="videos")
    subject = models.ForeignKey("schools.Subject", on_delete=models.CASCADE, related_name="videos")
    topic = models.ForeignKey(Topic, on_delete=models.SET_NULL, null=True, blank=True, related_name="videos")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    # Demo: external URL or storage key
    stream_url = models.URLField(blank=True, default="")
    duration_seconds = models.PositiveIntegerField(default=0)
    is_free = models.BooleanField(default=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_published = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class VideoEntitlement(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="entitlements")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="video_entitlements")
    source = models.CharField(max_length=32, default="purchase")  # purchase | class_grant
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("video", "user")]


class Exam(models.Model):
    class ExamType(models.TextChoices):
        DTM = "dtm", "DTM"
        BILET = "bilet", "Bilet"
        KELAJAK = "kelajak", "Kelajak"
        OTHER = "other", "Other"

    school = models.ForeignKey("schools.School", on_delete=models.CASCADE, related_name="exams")
    exam_type = models.CharField(max_length=16, choices=ExamType.choices, db_index=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    subject = models.ForeignKey(
        "schools.Subject", on_delete=models.SET_NULL, null=True, blank=True
    )
    # Optional link to assignment template / question snapshot
    question_snapshot = models.JSONField(default=list, blank=True)
    duration_minutes = models.PositiveIntegerField(default=60)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["exam_type", "title"]
