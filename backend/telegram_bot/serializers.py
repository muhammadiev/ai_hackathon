from rest_framework import serializers
from .models import TelegramInbound, TelegramChannelSettings


class TelegramInboundSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True, default=None)
    assignment_title = serializers.CharField(
        source="assignment.title", read_only=True, default=None
    )

    class Meta:
        model = TelegramInbound
        fields = (
            "id",
            "telegram_user_id",
            "message_id",
            "telegram_username",
            "user",
            "username",
            "school",
            "assignment",
            "assignment_title",
            "status",
            "text",
            "file_ids",
            "ai_score",
            "ai_max_score",
            "ai_feedback",
            "ai_confidence",
            "review_notes",
            "submission",
            "created_at",
            "confirmed_at",
        )


class AssignSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()


class AIGradeSerializer(serializers.Serializer):
    scenario = serializers.ChoiceField(
        choices=["clear", "ambiguous", "failed"], default="clear"
    )


class ConfirmGradeSerializer(serializers.Serializer):
    score = serializers.DecimalField(
        max_digits=8, decimal_places=2, required=False, allow_null=True
    )
    max_score = serializers.DecimalField(
        max_digits=8, decimal_places=2, required=False, allow_null=True
    )
    publish = serializers.BooleanField(default=True)
    review_notes = serializers.CharField(required=False, allow_blank=True, default="")


class ChannelSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelegramChannelSettings
        fields = (
            "school",
            "intake_enabled",
            "ai_grade_enabled",
            "bot_username",
            "updated_at",
        )
        read_only_fields = ("school", "updated_at")
