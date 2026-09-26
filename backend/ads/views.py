from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from accounts.permissions import IsSuperAdmin, IsTeacherOrAdmin
from accounts.scoping import active_school_ids
from schools.models import School
from .models import AdPrompt, AdCreative, AdImpression
from .serializers import (
    AdPromptSerializer,
    AdPromptCreateSerializer,
    AdCreativeSerializer,
    AdCreativePublicSerializer,
    AdCreativeStatusSerializer,
    ImpressionSerializer,
)
from . import services


def _is_ad_manager(user):
    return user.global_role in ("superadmin", "admin")


class AdPromptListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_ad_manager(request.user):
            return Response(
                {"ok": False, "error": "Ruxsat yo‘q."}, status=status.HTTP_403_FORBIDDEN
            )
        qs = AdPrompt.objects.all().order_by("-created_at")
        if request.user.global_role != "superadmin":
            sids = active_school_ids(request.user)
            qs = qs.filter(school_id__in=sids)
        qs = qs[:50]
        return Response(
            {"count": len(qs), "results": AdPromptSerializer(qs, many=True).data}
        )

    def post(self, request):
        if not _is_ad_manager(request.user):
            return Response(
                {"ok": False, "error": "Ruxsat yo‘q."}, status=status.HTTP_403_FORBIDDEN
            )
        ser = AdPromptCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        school = None
        if request.user.global_role == "superadmin" and data.get("school_id"):
            school = get_object_or_404(School, pk=data["school_id"])
        elif request.user.global_role == "admin":
            sids = active_school_ids(request.user)
            school = School.objects.filter(pk=sids[0]).first() if sids else None

        prompt = AdPrompt.objects.create(
            school=school,
            category=data["category"],
            title=(data.get("title") or "")[:200],
            prompt_text=data["prompt_text"],
            created_by=request.user,
        )
        creatives = []
        if data.get("generate", True):
            try:
                creatives = services.generate_creatives_from_prompt(
                    prompt=prompt,
                    actor=request.user,
                    variants=data.get("variants", 2),
                )
            except DjangoValidationError as e:
                return Response(
                    {
                        "ok": False,
                        "error": e.messages if hasattr(e, "messages") else str(e),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response(
            {
                "prompt": AdPromptSerializer(prompt).data,
                "creatives": AdCreativeSerializer(creatives, many=True).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AdPromptGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not _is_ad_manager(request.user):
            return Response(
                {"ok": False, "error": "Ruxsat yo‘q."}, status=status.HTTP_403_FORBIDDEN
            )
        prompt = get_object_or_404(AdPrompt, pk=pk)
        variants = int(request.data.get("variants", 2))
        try:
            creatives = services.generate_creatives_from_prompt(
                prompt=prompt, actor=request.user, variants=variants
            )
        except DjangoValidationError as e:
            return Response(
                {"ok": False, "error": e.messages if hasattr(e, "messages") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        prompt.refresh_from_db()
        return Response(
            {
                "prompt": AdPromptSerializer(prompt).data,
                "creatives": AdCreativeSerializer(creatives, many=True).data,
            }
        )


class AdCreativeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_ad_manager(request.user):
            return Response(
                {"ok": False, "error": "Ruxsat yo‘q."}, status=status.HTTP_403_FORBIDDEN
            )
        qs = AdCreative.objects.all().order_by("priority", "-created_at")
        if request.user.global_role != "superadmin":
            sids = active_school_ids(request.user)
            qs = qs.filter(school_id__in=sids)
        st = request.query_params.get("status")
        if st:
            qs = qs.filter(status=st)
        qs = qs[:100]
        return Response(
            {"count": len(qs), "results": AdCreativeSerializer(qs, many=True).data}
        )


class AdCreativeStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not _is_ad_manager(request.user):
            return Response(
                {"ok": False, "error": "Ruxsat yo‘q."}, status=status.HTTP_403_FORBIDDEN
            )
        creative = get_object_or_404(AdCreative, pk=pk)
        ser = AdCreativeStatusSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            creative = services.set_creative_status(
                creative=creative,
                status=ser.validated_data["status"],
                actor=request.user,
            )
        except DjangoValidationError as e:
            return Response(
                {"ok": False, "error": e.messages if hasattr(e, "messages") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(AdCreativeSerializer(creative).data)


class ActiveAdsView(APIView):
    """Student feed — every item has is_advertisement=true and label Reklama."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        ads = services.active_ads_for_user(request.user, limit=10)
        data = AdCreativePublicSerializer(ads, many=True).data
        for row in data:
            row["is_advertisement"] = True
            row["label"] = row.get("label") or "Reklama"
        return Response({"count": len(data), "results": data})


class AdImpressionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        creative = get_object_or_404(AdCreative, pk=pk, status=AdCreative.Status.LIVE)
        ser = ImpressionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        AdImpression.objects.create(
            creative=creative,
            user=request.user,
            clicked=ser.validated_data.get("clicked", False),
        )
        return Response({"ok": True}, status=status.HTTP_201_CREATED)
