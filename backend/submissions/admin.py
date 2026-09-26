from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Submission, Answer, SubmissionFile


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 0


@admin.register(Submission)
class SubmissionAdmin(ModelAdmin):
    list_display = (
        "id",
        "student",
        "assignment",
        "source",
        "status",
        "score",
        "attempt_no",
    )
    list_filter = ("source", "status")
    inlines = [AnswerInline]
