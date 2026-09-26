"""
Paper tests: print batches, scans, OMR results.
Confirm path writes into submissions.Submission — never a parallel grade table.
"""
from django.conf import settings
from django.db import models


class PaperBatch(models.Model):
    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, related_name="paper_batches"
    )
    assignment = models.ForeignKey(
        "assignments.Assignment",
        on_delete=models.CASCADE,
        related_name="paper_batches",
    )
    class_group = models.ForeignKey(
        "schools.ClassGroup", on_delete=models.CASCADE, related_name="paper_batches"
    )
    code = models.CharField(max_length=6, db_index=True)  # 6-digit assignment code
    personalized = models.BooleanField(default=True)
    title = models.CharField(max_length=255)
    # frozen copy of questions for this print run
    questions = models.JSONField(default=list)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("school", "code")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"Batch {self.code} · {self.title}"


class PaperSheetStudent(models.Model):
    batch = models.ForeignKey(
        PaperBatch, on_delete=models.CASCADE, related_name="students"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="paper_sheets"
    )
    pupil_code = models.CharField(max_length=6, db_index=True)
    student_name = models.CharField(max_length=200, blank=True, default="")

    class Meta:
        unique_together = [("batch", "student"), ("batch", "pupil_code")]


class ScanJob(models.Model):
    class Status(models.TextChoices):
        UPLOADED = "uploaded", "Uploaded"
        PROCESSING = "processing", "Processing"
        NEEDS_REVIEW = "needs_review", "Needs review"
        READY = "ready", "Ready"
        CONFIRMED = "confirmed", "Confirmed"
        REJECTED = "rejected", "Rejected"

    school = models.ForeignKey("schools.School", on_delete=models.CASCADE)
    batch = models.ForeignKey(
        PaperBatch, on_delete=models.SET_NULL, null=True, blank=True, related_name="scans"
    )
    assignment = models.ForeignKey(
        "assignments.Assignment",
        on_delete=models.CASCADE,
        related_name="scans",
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scan_jobs",
    )
    pupil_code = models.CharField(max_length=6, blank=True, default="")
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.UPLOADED, db_index=True
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_scans",
    )
    # multipage: list of StoredFile ids
    file_ids = models.JSONField(default=list)
    omr_raw = models.JSONField(default=dict, blank=True)
    confidence_avg = models.FloatField(null=True, blank=True)
    review_notes = models.TextField(blank=True, default="")
    # after confirm
    submission = models.OneToOneField(
        "submissions.Submission",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="scan_job",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="confirmed_scans",
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Scan #{self.pk} [{self.status}]"


class ScanAnswer(models.Model):
    scan = models.ForeignKey(ScanJob, on_delete=models.CASCADE, related_name="answers")
    question_index = models.PositiveSmallIntegerField()
    # detected letters e.g. ["B"] or ["A","C"] if multi/ambiguous
    marked = models.JSONField(default=list)
    confidence = models.FloatField(null=True, blank=True)
    is_resolved = models.BooleanField(default=False)
    # teacher override
    final_mark = models.JSONField(null=True, blank=True)

    class Meta:
        unique_together = [("scan", "question_index")]
        ordering = ["question_index"]
