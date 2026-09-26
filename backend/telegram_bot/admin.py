from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import TelegramInbound, TelegramChannelSettings


@admin.register(TelegramChannelSettings)
class TelegramChannelSettingsAdmin(ModelAdmin):
    list_display = ("school", "intake_enabled", "ai_grade_enabled", "bot_username")


@admin.register(TelegramInbound)
class TelegramInboundAdmin(ModelAdmin):
    list_display = (
        "id",
        "telegram_user_id",
        "telegram_username",
        "user",
        "assignment",
        "status",
        "ai_confidence",
        "created_at",
    )
    list_filter = ("status", "ai_confidence", "school")
    search_fields = ("telegram_username", "text", "user__username")
    readonly_fields = ("raw_update", "created_at", "updated_at", "confirmed_at")
