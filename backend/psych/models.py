from django.conf import settings
from django.db import models


class Questionnaire(models.Model):
    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, null=True, blank=True, related_name="questionnaires"
    )
    title = models.CharField(max_length=200)
    version = models.PositiveIntegerField(default=1)
    items = models.JSONField(default=list)  # [{text, options?}]
    is_active = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class PsychResponse(models.Model):
    questionnaire = models.ForeignKey(Questionnaire, on_delete=models.CASCADE, related_name="responses")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="psych_responses")
    answers = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("questionnaire", "student")]
