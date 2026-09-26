from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display = ("id", "user", "title", "is_read", "created_at")
    list_filter = ("is_read",)
    search_fields = ("title", "user__username")
