from rest_framework import serializers
from .models import AdPrompt, AdCreative, AdImpression


class AdPromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdPrompt
        fields = (
            "id",
            "school",
            "category",
            "title",
            "prompt_text",
            "status",
            "created_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("status", "created_by", "created_at", "updated_at")


class AdPromptCreateSerializer(serializers.Serializer):
    category = serializers.ChoiceField(choices=[c[0] for c in AdPrompt.Category.choices])
    title = serializers.CharField(required=False, allow_blank=True, max_length=200)
    prompt_text = serializers.CharField()
    school_id = serializers.IntegerField(required=False, allow_null=True)
    generate = serializers.BooleanField(default=True)
    variants = serializers.IntegerField(default=2, min_value=1, max_value=5)


class AdCreativeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdCreative
        fields = (
            "id",
            "prompt",
            "school",
            "category",
            "is_advertisement",
            "label",
            "headline",
            "body",
            "cta_text",
            "cta_url",
            "image_prompt",
            "image_url",
            "min_grade",
            "max_grade",
            "subject_ids",
            "status",
            "starts_at",
            "ends_at",
            "priority",
            "created_at",
        )
        read_only_fields = ("is_advertisement", "label", "created_at")


class AdCreativePublicSerializer(serializers.ModelSerializer):
    """Student payload — always includes reklama markers."""

    class Meta:
        model = AdCreative
        fields = (
            "id",
            "is_advertisement",
            "label",
            "category",
            "headline",
            "body",
            "cta_text",
            "cta_url",
            "image_url",
        )


class AdCreativeStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[c[0] for c in AdCreative.Status.choices])


class ImpressionSerializer(serializers.Serializer):
    clicked = serializers.BooleanField(default=False)
