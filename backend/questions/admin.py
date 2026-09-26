from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Question, QuestionVersion


class VersionInline(admin.TabularInline):
    model = QuestionVersion
    extra = 0
    readonly_fields = ("version", "created_at")


@admin.register(Question)
class QuestionAdmin(ModelAdmin):
    list_display = ("id", "qtype", "status", "subject", "grade", "current_version")
    list_filter = ("status", "qtype", "school")
    inlines = [VersionInline]
