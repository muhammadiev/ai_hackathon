from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from .models import User, Profile, SchoolMembership, TelegramLink, TelegramLinkCode


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    list_display = (
        "username",
        "global_role",
        "phone",
        "is_active",
        "is_staff",
        "last_login",
    )
    list_filter = ("global_role", "is_active", "is_staff")
    search_fields = ("username", "phone", "email")
    ordering = ("username",)
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Mirae", {"fields": ("global_role", "phone", "must_change_password")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Mirae", {"fields": ("global_role", "phone")}),
    )
    list_per_page = 50


@admin.register(Profile)
class ProfileAdmin(ModelAdmin):
    list_display = ("user", "full_name", "language", "theme", "updated_at")
    search_fields = ("full_name", "user__username", "email")
    list_filter = ("language", "theme")
    autocomplete_fields = ("user",)


@admin.register(SchoolMembership)
class SchoolMembershipAdmin(ModelAdmin):
    list_display = ("user", "school", "role", "academic_year", "is_active")
    list_filter = ("role", "is_active", "school")
    search_fields = ("user__username", "school__name")
    autocomplete_fields = ("user", "school", "academic_year")


@admin.register(TelegramLink)
class TelegramLinkAdmin(ModelAdmin):
    list_display = ("user", "telegram_user_id", "telegram_username", "is_active", "linked_at")
    search_fields = ("user__username", "telegram_username")


@admin.register(TelegramLinkCode)
class TelegramLinkCodeAdmin(ModelAdmin):
    list_display = ("code", "user", "expires_at", "used_at", "created_at")
    readonly_fields = ("code", "created_at")
