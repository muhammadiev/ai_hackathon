from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import (
    StudentTwin,
    TwinSnapshot,
    AccelerationPack,
    ParentPurchase,
    TeacherRevenueShareRule,
    RevenueShareEvent,
)


@admin.register(StudentTwin)
class StudentTwinAdmin(ModelAdmin):
    list_display = (
        "student",
        "probability_low",
        "probability_high",
        "top_direction",
        "last_recomputed_at",
    )
    search_fields = ("student__username",)


@admin.register(TwinSnapshot)
class TwinSnapshotAdmin(ModelAdmin):
    list_display = ("twin", "probability_low", "probability_high", "trigger", "computed_at")
    list_filter = ("trigger",)


@admin.register(AccelerationPack)
class AccelerationPackAdmin(ModelAdmin):
    list_display = (
        "id",
        "student",
        "status",
        "price",
        "duration_weeks",
        "purchased_at",
    )
    list_filter = ("status",)


@admin.register(ParentPurchase)
class ParentPurchaseAdmin(ModelAdmin):
    list_display = ("parent_link", "pack", "amount", "status", "created_at")


@admin.register(TeacherRevenueShareRule)
class TeacherRevenueShareRuleAdmin(ModelAdmin):
    list_display = ("category", "percentage", "is_active")


@admin.register(RevenueShareEvent)
class RevenueShareEventAdmin(ModelAdmin):
    list_display = ("pack", "teacher", "amount", "created_at")
