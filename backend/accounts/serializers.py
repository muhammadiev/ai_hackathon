from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile, SchoolMembership, TelegramLink

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = (
            "full_name",
            "email",
            "language",
            "theme",
            "privacy_hide_phone",
            "privacy_hide_email",
            "avatar",
        )


class MembershipSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source="school.name", read_only=True)
    school_code = serializers.CharField(source="school.code", read_only=True)
    year_label = serializers.CharField(source="academic_year.label", read_only=True)

    class Meta:
        model = SchoolMembership
        fields = (
            "id",
            "school",
            "school_name",
            "school_code",
            "academic_year",
            "year_label",
            "role",
            "is_active",
        )


class MeSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()
    memberships = MembershipSerializer(many=True, read_only=True)
    telegram_linked = serializers.SerializerMethodField()
    wallet_balance = serializers.SerializerMethodField()
    class_info = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "global_role",
            "phone",
            "must_change_password",
            "profile",
            "memberships",
            "telegram_linked",
            "wallet_balance",
            "class_info",
        )
        read_only_fields = (
            "id",
            "username",
            "global_role",
            "must_change_password",
            "wallet_balance",
            "class_info",
        )

    def get_telegram_linked(self, obj):
        return hasattr(obj, "telegram_link") and obj.telegram_link.is_active

    def get_wallet_balance(self, obj):
        try:
            from payments.services import get_or_create_wallet
            w = get_or_create_wallet(obj)
            return str(w.balance)
        except Exception:
            return "0"

    def get_class_info(self, obj):
        if obj.global_role != "student":
            return None
        try:
            from schools.models import ClassEnrollment
            en = (
                ClassEnrollment.objects.filter(student=obj, is_active=True)
                .select_related("class_group", "class_group__school")
                .first()
            )
            if not en:
                return None
            cg = en.class_group
            return {
                "class_id": cg.id,
                "class_name": cg.name,
                "grade": cg.grade,
                "school_id": cg.school_id,
                "pupil_code": en.pupil_code,
            }
        except Exception:
            return None

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if profile_data:
            profile, _ = Profile.objects.get_or_create(user=instance)
            for attr, val in profile_data.items():
                setattr(profile, attr, val)
            profile.save()
        return instance
