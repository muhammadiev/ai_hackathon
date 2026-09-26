from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import timedelta
import secrets

from .serializers import MeSerializer
from .models import Profile, TelegramLinkCode


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        Profile.objects.get_or_create(user=user)
        return user


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh")
        if refresh:
            try:
                token = RefreshToken(refresh)
                token.blacklist()
            except Exception:
                pass
        return Response({"ok": True})


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError

        old = request.data.get("old_password", "")
        new = request.data.get("new_password", "")
        if not request.user.check_password(old):
            return Response(
                {"ok": False, "error": "Eski parol noto‘g‘ri."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            validate_password(new, user=request.user)
        except DjangoValidationError as e:
            return Response(
                {"ok": False, "error": e.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.set_password(new)
        request.user.must_change_password = False
        request.user.save(update_fields=["password", "must_change_password"])
        return Response({"ok": True})


class TelegramLinkStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = secrets.token_hex(3).upper()  # 6 chars
        TelegramLinkCode.objects.create(
            user=request.user,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=15),
        )
        return Response({"ok": True, "code": code, "expires_in_seconds": 900})
