from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(ModelAdmin):
    list_display = ("created_at", "actor", "action", "message")
    list_filter = ("action",)
    readonly_fields = ("actor", "school", "action", "object_type", "object_id", "message", "meta", "created_at")
