from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import StoredFile


@admin.register(StoredFile)
class StoredFileAdmin(ModelAdmin):
    list_display = ("id", "original_name", "kind", "status", "size_bytes", "created_at")
    list_filter = ("kind", "status")
