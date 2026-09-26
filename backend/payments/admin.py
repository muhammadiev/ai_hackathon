from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Wallet, LedgerEntry, TopUpCode, CodeRedemption


@admin.register(Wallet)
class WalletAdmin(ModelAdmin):
    list_display = ("user", "balance", "currency", "updated_at")
    search_fields = ("user__username",)
    readonly_fields = ("updated_at",)


@admin.register(LedgerEntry)
class LedgerEntryAdmin(ModelAdmin):
    list_display = ("id", "wallet", "kind", "amount", "balance_after", "title", "created_at")
    list_filter = ("kind",)
    search_fields = ("title", "reference", "wallet__user__username")
    readonly_fields = (
        "wallet",
        "kind",
        "amount",
        "balance_after",
        "title",
        "reference",
        "meta",
        "created_by",
        "created_at",
    )

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(TopUpCode)
class TopUpCodeAdmin(ModelAdmin):
    list_display = (
        "code",
        "amount",
        "redemption_count",
        "max_redemptions",
        "is_active",
        "expires_at",
    )
    list_filter = ("is_active",)
    search_fields = ("code", "note")


@admin.register(CodeRedemption)
class CodeRedemptionAdmin(ModelAdmin):
    list_display = ("code", "user", "created_at")
    readonly_fields = ("code", "user", "ledger", "created_at")
