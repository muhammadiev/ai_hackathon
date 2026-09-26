from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import AdPrompt, AdCreative, AdImpression


class CreativeInline(admin.TabularInline):
    model = AdCreative
    extra = 0
    fields = (
        "headline",
        "status",
        "label",
        "is_advertisement",
        "priority",
        "min_grade",
        "max_grade",
    )
    readonly_fields = ("is_advertisement",)


@admin.register(AdPrompt)
class AdPromptAdmin(ModelAdmin):
    list_display = ("id", "title", "category", "status", "school", "created_at")
    list_filter = ("category", "status")
    search_fields = ("title", "prompt_text")
    inlines = [CreativeInline]


@admin.register(AdCreative)
class AdCreativeAdmin(ModelAdmin):
    list_display = (
        "id",
        "headline",
        "category",
        "status",
        "label",
        "is_advertisement",
        "priority",
        "school",
    )
    list_filter = ("status", "category", "is_advertisement")
    search_fields = ("headline", "body")
    readonly_fields = ("is_advertisement",)
    list_editable = ("status", "priority")


@admin.register(AdImpression)
class AdImpressionAdmin(ModelAdmin):
    list_display = ("id", "creative", "user", "clicked", "created_at")
    list_filter = ("clicked",)
    readonly_fields = ("creative", "user", "clicked", "created_at")
