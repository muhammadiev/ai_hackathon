from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import (
    UnderstandingCheck,
    TopicMastery,
    BaselineSnapshot,
    EffectivenessReport,
    ParentLink,
    ParentWeeklyTip,
    OfflineSyncBatch,
    CreatorReward,
    CreatorBalance,
)


@admin.register(UnderstandingCheck)
class UnderstandingCheckAdmin(ModelAdmin):
    list_display = (
        "id",
        "student",
        "assignment",
        "status",
        "outcome",
        "flag_teacher",
        "created_at",
    )
    list_filter = ("status", "flag_teacher", "outcome")


@admin.register(TopicMastery)
class TopicMasteryAdmin(ModelAdmin):
    list_display = ("student", "subject", "topic_key", "p_know", "attempts", "updated_at")
    list_filter = ("subject",)


@admin.register(BaselineSnapshot)
class BaselineSnapshotAdmin(ModelAdmin):
    list_display = ("label", "school", "class_group", "period_start", "period_end")


@admin.register(EffectivenessReport)
class EffectivenessReportAdmin(ModelAdmin):
    list_display = ("title", "kind", "school", "created_at")
    list_filter = ("kind",)


@admin.register(ParentLink)
class ParentLinkAdmin(ModelAdmin):
    list_display = ("student", "parent_name", "parent_phone", "is_active")


@admin.register(ParentWeeklyTip)
class ParentWeeklyTipAdmin(ModelAdmin):
    list_display = ("student", "week_key", "title", "status", "sent_at")


@admin.register(OfflineSyncBatch)
class OfflineSyncBatchAdmin(ModelAdmin):
    list_display = ("student", "client_batch_id", "status", "created_at")


@admin.register(CreatorBalance)
class CreatorBalanceAdmin(ModelAdmin):
    list_display = ("teacher", "points", "reuse_count", "updated_at")


@admin.register(CreatorReward)
class CreatorRewardAdmin(ModelAdmin):
    list_display = ("teacher", "kind", "points", "note", "created_at")
