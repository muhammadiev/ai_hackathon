from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import PaperBatch, PaperSheetStudent, ScanJob, ScanAnswer


class SheetInline(admin.TabularInline):
    model = PaperSheetStudent
    extra = 0


@admin.register(PaperBatch)
class PaperBatchAdmin(ModelAdmin):
    list_display = ("code", "title", "class_group", "assignment", "created_at")
    list_filter = ("school",)
    inlines = [SheetInline]


class ScanAnswerInline(admin.TabularInline):
    model = ScanAnswer
    extra = 0


@admin.register(ScanJob)
class ScanJobAdmin(ModelAdmin):
    list_display = ("id", "assignment", "student", "status", "created_at")
    list_filter = ("status",)
    inlines = [ScanAnswerInline]
