from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.scoping import active_school_ids
from schools.models import School
from .models import SupportMessage, SchoolContact


class SupportMessageListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.global_role in ("admin", "superadmin", "teacher"):
            sids = active_school_ids(request.user)
            qs = SupportMessage.objects.filter(school_id__in=sids).select_related("user")[:100]
        else:
            qs = SupportMessage.objects.filter(user=request.user)[:100]
        return Response(
            {
                "count": len(qs),
                "results": [
                    {
                        "id": m.id,
                        "user": m.user.username,
                        "body": m.body,
                        "is_from_staff": m.is_from_staff,
                        "created_at": m.created_at,
                    }
                    for m in qs
                ],
            }
        )

    def post(self, request):
        sids = active_school_ids(request.user)
        school = School.objects.filter(pk=sids[0]).first() if sids else None
        body = (request.data.get("body") or "").strip()
        if not body:
            return Response({"ok": False, "error": "Matn bo‘sh."}, status=400)
        is_staff = request.user.global_role in ("admin", "superadmin", "teacher")
        m = SupportMessage.objects.create(
            school=school,
            user=request.user,
            body=body,
            is_from_staff=is_staff and bool(request.data.get("as_staff", is_staff)),
        )
        return Response({"id": m.id, "body": m.body}, status=201)


class SchoolContactsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sids = active_school_ids(request.user)
        if not sids:
            return Response({"telegram": "", "instagram": "", "facebook": "", "phone": ""})
        obj, _ = SchoolContact.objects.get_or_create(school_id=sids[0])
        return Response(
            {
                "telegram": obj.telegram,
                "instagram": obj.instagram,
                "facebook": obj.facebook,
                "phone": obj.phone,
            }
        )
