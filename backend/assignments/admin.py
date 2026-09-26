from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Assignment, AssignmentTarget, AssignmentAttachment


class TargetInline(admin.TabularInline):
    model = AssignmentTarget
    extra = 0


@admin.register(Assignment)
class AssignmentAdmin(ModelAdmin):
    list_display = ("title", "kind", "status", "subject", "lesson_date", "school")
    list_filter = ("status", "kind", "school")
    inlines = [TargetInline]
