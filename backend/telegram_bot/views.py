import os
import hmac
from decimal import Decimal
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from accounts.permissions import IsTeacherOrAdmin
from accounts.scoping import active_school_ids, assert_teacher_can_access_assignment
from assignments.models import Assignment
from .models import TelegramInbound, TelegramChannelSettings
from .serializers import (
    TelegramInboundSerializer,
    AssignSerializer,
    AIGradeSerializer,
    ConfirmGradeSerializer,
    ChannelSettingsSerializer,
)
from . import services


def _val_err(e):
    msg = e.messages if hasattr(e, "messages") else [str(e)]
    text = " ".join(msg) if isinstance(msg, list) else str(msg)
    code = (
        status.HTTP_409_CONFLICT
        if "409" in text or "allaqachon" in text.lower()
        else status.HTTP_400_BAD_REQUEST
    )
    return Response({"ok": False, "error": msg}, status=code)


def hmac_compare(a: str, b: str) -> bool:
    try:
        return hmac.compare_digest(a or "", b or "")
    except Exception:
        return False


@method_decorator(csrf_exempt, name="dispatch")
class TelegramWebhookView(APIView):
    """
    Public webhook. Auth via X-Telegram-Bot-Api-Secret-Token header
    matching TELEGRAM_WEBHOOK_SECRET env (or settings).
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        from django.conf import settings as dj_settings

        expected = (
            os.environ.get("TELEGRAM_WEBHOOK_SECRET")
            or getattr(dj_settings, "TELEGRAM_WEBHOOK_SECRET", "")
            or ""
        ).strip()
        allow_insecure = getattr(
            dj_settings, "TELEGRAM_WEBHOOK_ALLOW_INSECURE_DEBUG", False
        ) and getattr(dj_settings, "DEBUG", False)
        if not expected:
            if not allow_insecure:
                return Response(
                    {
                        "ok": False,
                        "error": "Webhook secret not configured. Set TELEGRAM_WEBHOOK_SECRET.",
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
        else:
            got = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
            if not hmac_compare(got, expected):
                return Response(
                    {"ok": False, "error": "Unauthorized"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        update = request.data if isinstance(request.data, dict) else {}
        try:
            inbound = services.ingest_update(update)
        except Exception as e:
            return Response(
                {"ok": False, "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if inbound is None:
            return Response({"ok": True, "ignored": True})
        return Response(
            {"ok": True, "inbound_id": inbound.id, "status": inbound.status}
        )


class TelegramInboxView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        sids = active_school_ids(request.user)
        qs = TelegramInbound.objects.filter(school_id__in=sids).select_related(
            "user", "assignment"
        )
        st = request.query_params.get("status")
        if st:
            qs = qs.filter(status=st)
        qs = qs.order_by("-created_at")[:100]
        return Response(
            {
                "count": len(qs),
                "results": TelegramInboundSerializer(qs, many=True).data,
            }
        )


class TelegramInboundDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request, pk):
        obj = get_object_or_404(TelegramInbound, pk=pk)
        if obj.school_id and obj.school_id not in active_school_ids(request.user):
            if request.user.global_role != "superadmin":
                return Response(
                    {"ok": False, "error": "Ruxsat yo‘q."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return Response(TelegramInboundSerializer(obj).data)


class TelegramAssignView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request, pk):
        inbound = get_object_or_404(TelegramInbound, pk=pk)
        ser = AssignSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        asg = get_object_or_404(Assignment, pk=ser.validated_data["assignment_id"])
        assert_teacher_can_access_assignment(request.user, asg)
        try:
            inbound = services.assign_inbound(
                inbound=inbound, assignment=asg, actor=request.user
            )
        except DjangoValidationError as e:
            return _val_err(e)
        return Response(TelegramInboundSerializer(inbound).data)


class TelegramAIGradeView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request, pk):
        inbound = get_object_or_404(TelegramInbound, pk=pk)
        if inbound.assignment_id:
            assert_teacher_can_access_assignment(request.user, inbound.assignment)
        ser = AIGradeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            inbound = services.run_demo_ai_grade(
                inbound=inbound, scenario=ser.validated_data["scenario"]
            )
        except DjangoValidationError as e:
            return _val_err(e)
        return Response(TelegramInboundSerializer(inbound).data)


class TelegramConfirmView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request, pk):
        inbound = get_object_or_404(TelegramInbound, pk=pk)
        if inbound.assignment_id:
            assert_teacher_can_access_assignment(request.user, inbound.assignment)
        ser = ConfirmGradeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        if data.get("review_notes"):
            inbound.review_notes = data["review_notes"]
            inbound.save(update_fields=["review_notes", "updated_at"])
        try:
            sub = services.confirm_inbound_grade(
                inbound=inbound,
                actor=request.user,
                score=data.get("score"),
                max_score=data.get("max_score"),
                publish=data.get("publish", True),
            )
        except DjangoValidationError as e:
            return _val_err(e)
        return Response(
            {
                "ok": True,
                "submission_id": sub.id,
                "score": str(sub.score),
                "max_score": str(sub.max_score),
                "status": sub.status,
                "source": sub.source,
            }
        )


class TelegramChannelSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        sids = active_school_ids(request.user)
        if not sids:
            return Response({"ok": False, "error": "Maktab yo‘q."}, status=400)
        obj, _ = TelegramChannelSettings.objects.get_or_create(school_id=sids[0])
        return Response(ChannelSettingsSerializer(obj).data)

    def patch(self, request):
        if request.user.global_role not in ("admin", "superadmin"):
            return Response(
                {"ok": False, "error": "Faqat admin."},
                status=status.HTTP_403_FORBIDDEN,
            )
        sids = active_school_ids(request.user)
        obj, _ = TelegramChannelSettings.objects.get_or_create(school_id=sids[0])
        for field in ("intake_enabled", "ai_grade_enabled", "bot_username"):
            if field in request.data:
                setattr(obj, field, request.data[field])
        obj.save()
        return Response(ChannelSettingsSerializer(obj).data)
