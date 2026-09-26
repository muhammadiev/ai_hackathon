from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.scoping import active_school_ids
from schools.models import School
from .models import Questionnaire, PsychResponse


class QuestionnaireListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sids = active_school_ids(request.user)
        qs = Questionnaire.objects.filter(school_id__in=sids)[:50]
        return Response(
            {
                "count": len(qs),
                "results": [
                    {
                        "id": q.id,
                        "title": q.title,
                        "version": q.version,
                        "is_active": q.is_active,
                        "items_count": len(q.items or []),
                    }
                    for q in qs
                ],
            }
        )

    def post(self, request):
        if request.user.global_role not in ("admin", "superadmin"):
            return Response({"ok": False, "error": "Faqat admin."}, status=403)
        sids = active_school_ids(request.user)
        school = School.objects.filter(pk=sids[0]).first() if sids else None
        q = Questionnaire.objects.create(
            school=school,
            title=request.data.get("title") or "So‘rovnoma",
            items=request.data.get("items") or [],
            is_active=bool(request.data.get("is_active", False)),
            created_by=request.user,
        )
        return Response({"id": q.id, "title": q.title}, status=201)


class QuestionnairePublishView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.global_role not in ("admin", "superadmin"):
            return Response({"ok": False, "error": "Faqat admin."}, status=403)
        q = get_object_or_404(Questionnaire, pk=pk)
        q.is_active = True
        q.save(update_fields=["is_active"])
        return Response({"ok": True, "id": q.id, "is_active": True})


class PsychResponseListView(APIView):
    """Admin only — product decision."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.global_role not in ("admin", "superadmin"):
            return Response({"ok": False, "error": "Faqat admin."}, status=403)
        qs = PsychResponse.objects.select_related("student", "questionnaire")[:100]
        return Response(
            {
                "count": len(qs),
                "results": [
                    {
                        "id": r.id,
                        "student": r.student.username,
                        "questionnaire_id": r.questionnaire_id,
                        "created_at": r.created_at,
                    }
                    for r in qs
                ],
            }
        )
