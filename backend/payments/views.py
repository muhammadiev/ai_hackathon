from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError

from accounts.permissions import IsTeacherOrAdmin
from .models import LedgerEntry, TopUpCode
from .serializers import (
    WalletSerializer,
    LedgerSerializer,
    TopUpCodeSerializer,
    TopUpPhoneSerializer,
    AdminCodeCreateSerializer,
)
from . import services


def _err(e):
    msg = e.messages if hasattr(e, "messages") else [str(e)]
    return Response({"ok": False, "error": msg}, status=status.HTTP_400_BAD_REQUEST)


class WalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        w = services.get_or_create_wallet(request.user)
        return Response(WalletSerializer(w).data)


class LedgerListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        w = services.get_or_create_wallet(request.user)
        qs = w.ledger.all()[:50]
        return Response(
            {"count": len(qs), "results": LedgerSerializer(qs, many=True).data}
        )


class TopUpCodeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = TopUpCodeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            entry = services.topup_by_code(
                user=request.user, code=ser.validated_data["code"]
            )
        except DjangoValidationError as e:
            return _err(e)
        w = entry.wallet
        return Response(
            {
                "ok": True,
                "balance": str(w.balance),
                "entry": LedgerSerializer(entry).data,
                "demo": True,
                "message": "Demo balans to‘ldirildi (haqiqiy to‘lov emas).",
            }
        )


class TopUpPhoneView(APIView):
    """Demo only — no SMS/provider."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = TopUpPhoneSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            entry = services.topup_by_phone(
                user=request.user,
                phone=ser.validated_data["phone"],
                amount=ser.validated_data["amount"],
            )
        except DjangoValidationError as e:
            return _err(e)
        return Response(
            {
                "ok": True,
                "balance": str(entry.wallet.balance),
                "entry": LedgerSerializer(entry).data,
                "demo": True,
                "message": "Demo telefon to‘ldirish. Hech qanday provayder chaqirilmadi.",
            }
        )


class AdminTopUpCodeView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request):
        if request.user.global_role not in ("admin", "superadmin"):
            return Response(
                {"ok": False, "error": "Faqat admin."},
                status=status.HTTP_403_FORBIDDEN,
            )
        ser = AdminCodeCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        code = d["code"].strip().upper()
        obj, created = TopUpCode.objects.get_or_create(
            code=code,
            defaults={
                "amount": d["amount"],
                "max_redemptions": d["max_redemptions"],
                "note": d.get("note") or "",
            },
        )
        if not created:
            return Response(
                {"ok": False, "error": "Kod allaqachon mavjud."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(
            {
                "ok": True,
                "code": obj.code,
                "amount": str(obj.amount),
                "max_redemptions": obj.max_redemptions,
            },
            status=status.HTTP_201_CREATED,
        )

    def get(self, request):
        if request.user.global_role not in ("admin", "superadmin"):
            return Response(
                {"ok": False, "error": "Faqat admin."},
                status=status.HTTP_403_FORBIDDEN,
            )
        qs = TopUpCode.objects.all()[:50]
        return Response(
            {
                "count": len(qs),
                "results": [
                    {
                        "code": x.code,
                        "amount": str(x.amount),
                        "max_redemptions": x.max_redemptions,
                        "redemption_count": x.redemption_count,
                        "is_active": x.is_active,
                    }
                    for x in qs
                ],
            }
        )
