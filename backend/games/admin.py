from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import GameSession


@admin.register(GameSession)
class GameSessionAdmin(ModelAdmin):
    list_display = (
        "id",
        "token_short",
        "intent",
        "status",
        "user",
        "assignment",
        "expires_at",
        "created_at",
    )
    list_filter = ("intent", "status")
    search_fields = ("token", "user__username")
    readonly_fields = ("token", "payload", "result_payload", "created_at", "completed_at")

    @admin.display(description="token")
    def token_short(self, obj):
        return obj.token[:12] + "…"
