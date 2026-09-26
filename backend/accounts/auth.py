"""Custom JWT login: accept username OR phone."""
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import serializers

User = get_user_model()


class MiraeTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Accepts:
      - username + password  (standard)
      - phone + password     (product login)
    Field name for login id can be `username` or `phone`.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make username not strictly required so phone-only payloads work
        self.fields[self.username_field].required = False
        self.fields["phone"] = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        login = (attrs.get(self.username_field) or "").strip()
        phone = (attrs.get("phone") or "").strip()
        password = attrs.get("password") or ""

        if not login and not phone:
            raise serializers.ValidationError(
                "username yoki phone kiriting.",
                code="authorization",
            )

        user = None
        if login:
            user = User.objects.filter(username__iexact=login).first()
            if user is None and "@" not in login:
                # try phone if they put digits in username field
                digits = "".join(ch for ch in login if ch.isdigit())
                if len(digits) >= 9:
                    user = User.objects.filter(phone__icontains=digits[-9:]).first()
        if user is None and phone:
            digits = "".join(ch for ch in phone if ch.isdigit())
            if digits:
                user = (
                    User.objects.filter(phone=phone).first()
                    or User.objects.filter(phone__endswith=digits[-9:]).first()
                )

        if user is None or not user.check_password(password):
            raise serializers.ValidationError(
                "Login yoki parol noto‘g‘ri.",
                code="authorization",
            )
        if not user.is_active:
            raise serializers.ValidationError(
                "Hisob faol emas.",
                code="authorization",
            )

        # Standard SimpleJWT flow needs username_field in attrs
        attrs[self.username_field] = user.get_username()
        data = super().validate(attrs)
        data["user_id"] = user.id
        data["username"] = user.username
        data["global_role"] = user.global_role
        data["must_change_password"] = user.must_change_password
        return data


class MiraeTokenObtainPairView(TokenObtainPairView):
    serializer_class = MiraeTokenObtainPairSerializer
