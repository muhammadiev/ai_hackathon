from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import SupportMessage, SchoolContact

@admin.register(SupportMessage)
class SupportMessageAdmin(ModelAdmin):
    list_display = ("user", "is_from_staff", "created_at")

@admin.register(SchoolContact)
class SchoolContactAdmin(ModelAdmin):
    list_display = ("school", "telegram", "phone")
