from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from accounts.permissions import IsTeacherOrAdmin
from insights.models import ParentLink
from kelajak.models import (
    StudentTwin,
    TwinSnapshot,
    AccelerationPack,
    RevenueShareEvent,
)
from kelajak import services

User = get_user_model()


def _err(e, code=status.HTTP_400_BAD_REQUEST):
    msg = e.messages if hasattr(e, "messages") else [str(e)]
    text = " ".join(msg) if isinstance(msg, list) else str(msg)
    if "Ruxsat" in text:
        code = status.HTTP_403_FORBIDDEN
    return Response({"ok": False, "error": msg}, status=code)


def _twin_payload(twin: StudentTwin) -> dict:
    snaps = list(twin.snapshots.order_by("computed_at")[:52])
    mid = float((twin.probability_low + twin.probability_high) / 2)
    return {
        "student_id": twin.student_id,
        "score_range": [str(twin.score_low), str(twin.score_high)],
        "probability_range": [str(twin.probability_low), str(twin.probability_high)],
        "probability_midpoint": round(mid, 1),
        "top_direction": twin.top_direction,
        "methodology_note": twin.methodology_note,
        "last_recomputed_at": twin.last_recomputed_at,
        "disclaimer": (
            "Natija kafolatlanmaydi. Diapazon — metodologiya va tarixiy ma’lumotlar asosida."
        ),
        "curve": [
            {
                "at": s.computed_at,
                "probability_range": [str(s.probability_low), str(s.probability_high)],
                "score_range": [str(s.score_low), str(s.score_high)],
                "direction": s.direction,
                "trigger": s.trigger,
            }
            for s in snaps
        ],
    }


def _pack_payload(p: AccelerationPack) -> dict:
    return {
        "id": p.id,
        "status": str(p.status),
        "duration_weeks": p.duration_weeks,
        "price": str(p.price),
        "target_topics": p.target_topics,
        "probability_before": [
            str(p.probability_before_low),
            str(p.probability_before_high),
        ],
        "probability_after_projected": [
            str(p.probability_after_low),
            str(p.probability_after_high),
        ],
        "disclaimer": p.disclaimer,
        "purchased_at": p.purchased_at,
        "completed_at": p.completed_at,
    }


class TwinMeView(APIView):
    """GET is read-only (no new snapshot). POST recompute for explicit refresh."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.global_role != "student":
            return Response({"ok": False, "error": "Faqat o‘quvchi."}, status=403)
        try:
            twin = services.get_or_create_twin_readonly(request.user)
        except DjangoValidationError as e:
            return _err(e)
        return Response(_twin_payload(twin))

    def post(self, request):
        if request.user.global_role != "student":
            return Response({"ok": False, "error": "Faqat o‘quvchi."}, status=403)
        twin = services.recompute_twin(
            student=request.user, trigger=TwinSnapshot.Trigger.MANUAL
        )
        return Response(_twin_payload(twin))


class TwinRecomputeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.global_role != "student":
            return Response({"ok": False, "error": "Faqat o‘quvchi."}, status=403)
        twin = services.recompute_twin(
            student=request.user, trigger=TwinSnapshot.Trigger.MANUAL
        )
        return Response(_twin_payload(twin))


class PackProposedView(APIView):
    """GET: read existing proposed pack only (no create). POST: generate proposal."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.global_role != "student":
            return Response({"ok": False, "error": "Faqat o‘quvchi."}, status=403)
        pack = AccelerationPack.objects.filter(
            student=request.user, status=AccelerationPack.Status.PROPOSED
        ).first()
        if pack is None:
            return Response(
                {
                    "ok": True,
                    "proposed": None,
                    "message": "Taklif yo‘q. Yangilash uchun POST qiling (mastery bo‘lsa).",
                }
            )
        return Response({"ok": True, "proposed": _pack_payload(pack)})

    def post(self, request):
        if request.user.global_role != "student":
            return Response({"ok": False, "error": "Faqat o‘quvchi."}, status=403)
        # Ensure twin exists, then propose from mastery only
        services.get_or_create_twin_readonly(request.user)
        pack = services.propose_pack(student=request.user)
        if pack is None:
            return Response(
                {
                    "ok": True,
                    "proposed": None,
                    "message": "Taklif yo‘q: mastery ma’lumot yo‘q yoki yaxshilanish ahamiyatsiz.",
                }
            )
        return Response({"ok": True, "proposed": _pack_payload(pack)}, status=201)


class PackDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        pack = get_object_or_404(AccelerationPack, pk=pk)
        try:
            services.assert_can_manage_pack(request.user, pack)
        except DjangoValidationError as e:
            return _err(e)
        return Response(_pack_payload(pack))


class PackPurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        pack = get_object_or_404(AccelerationPack, pk=pk)
        payer = (request.data.get("payer") or "student").lower()
        parent_link = None
        if payer == "parent":
            link_id = request.data.get("parent_link_id")
            if not link_id:
                return Response(
                    {"ok": False, "error": "parent_link_id kerak."}, status=400
                )
            parent_link = get_object_or_404(ParentLink, pk=link_id)
            payer_user = request.user
        else:
            if request.user.id != pack.student_id:
                return Response({"ok": False, "error": "Ruxsat yo‘q."}, status=403)
            payer_user = request.user

        try:
            pack = services.purchase_pack(
                pack=pack,
                payer_type=payer,
                payer_user=payer_user,
                parent_link=parent_link,
            )
        except DjangoValidationError as e:
            return _err(e)
        return Response(
            {
                "ok": True,
                "pack": _pack_payload(pack),
                "demo": True,
                "message": (
                    "Demo to‘lov (hamyon). Haqiqiy Click ulanmagan. "
                    "Natija kafolatlanmaydi."
                ),
            }
        )


class PackHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.global_role != "student":
            return Response({"ok": False, "error": "Faqat o‘quvchi."}, status=403)
        qs = AccelerationPack.objects.filter(student=request.user).exclude(
            status=AccelerationPack.Status.PROPOSED
        )[:20]
        return Response(
            {"count": len(qs), "results": [_pack_payload(p) for p in qs]}
        )


class PackCompleteView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request, pk):
        pack = get_object_or_404(AccelerationPack, pk=pk)
        try:
            services.assert_can_manage_pack(request.user, pack)
            pack = services.complete_pack(pack=pack)
        except DjangoValidationError as e:
            return _err(e)
        twin = StudentTwin.objects.filter(student_id=pack.student_id).first()
        return Response(
            {
                "ok": True,
                "pack": _pack_payload(pack),
                "twin_after": _twin_payload(twin) if twin else None,
            }
        )


class ParentChildTwinView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = get_object_or_404(User, pk=student_id)
        try:
            services.assert_can_view_student_twin(request.user, student)
        except DjangoValidationError as e:
            return _err(e)
        try:
            twin = services.get_or_create_twin_readonly(student)
        except DjangoValidationError as e:
            return _err(e)
        return Response(_twin_payload(twin))


class ParentChildPacksView(APIView):
    """Authorized read of existing proposed pack only — no write on GET."""

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = get_object_or_404(User, pk=student_id)
        try:
            services.assert_can_view_student_twin(request.user, student)
        except DjangoValidationError as e:
            return _err(e)
        pack = AccelerationPack.objects.filter(
            student=student, status=AccelerationPack.Status.PROPOSED
        ).first()
        return Response(
            {
                "ok": True,
                "proposed": _pack_payload(pack) if pack else None,
                "section_title": "Kelajak Investitsiya Paneli",
            }
        )

    def post(self, request, student_id):
        """Parent/teacher with access may request a new proposal for the child."""
        student = get_object_or_404(User, pk=student_id)
        try:
            services.assert_can_view_student_twin(request.user, student)
        except DjangoValidationError as e:
            return _err(e)
        services.get_or_create_twin_readonly(student)
        pack = services.propose_pack(student=student)
        return Response(
            {
                "ok": True,
                "proposed": _pack_payload(pack) if pack else None,
                "section_title": "Kelajak Investitsiya Paneli",
            },
            status=201 if pack else 200,
        )


class TeacherTwinEarningsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Sum

        qs = RevenueShareEvent.objects.filter(teacher=request.user)
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        week_ago = now - timedelta(days=7)
        month_total = qs.filter(created_at__gte=month_start).aggregate(s=Sum("amount"))[
            "s"
        ] or 0
        week_total = qs.filter(created_at__gte=week_ago).aggregate(s=Sum("amount"))[
            "s"
        ] or 0
        recent = qs[:10]
        return Response(
            {
                "this_month": str(month_total),
                "last_7_days": str(week_total),
                "recent": [
                    {
                        "pack_id": e.pack_id,
                        "amount": str(e.amount),
                        "created_at": e.created_at,
                    }
                    for e in recent
                ],
                "demo": True,
            }
        )
