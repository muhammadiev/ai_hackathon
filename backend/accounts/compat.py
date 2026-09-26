"""Path aliases so student frontend stubs can connect with minimal changes."""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.contrib.auth import get_user_model

from accounts.auth import MiraeTokenObtainPairView
from accounts.views import MeView, LogoutView, ChangePasswordView
from accounts.serializers import MeSerializer
from rest_framework.throttling import AnonRateThrottle

User = get_user_model()


class LoginThrottle(AnonRateThrottle):
    scope = "login"


class CompatLoginView(MiraeTokenObtainPairView):
    """POST /auth/login — same as /auth/token/ (username|phone + password)."""
    throttle_classes = [LoginThrottle]


class CompatMeView(MeView):
    """GET/PATCH /me — alias of /accounts/me/"""
    pass


class CompatDashboardView(APIView):
    """Minimal student home bundle."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from assignments.models import Assignment
        from submissions.models import Submission
        from schools.models import ClassEnrollment
        from django.utils import timezone

        user = request.user
        me = MeSerializer(user).data
        pending_hw = 0
        done_hw = 0
        if user.global_role == "student":
            en = ClassEnrollment.objects.filter(student=user, is_active=True).first()
            if en:
                asg_ids = list(
                    Assignment.objects.filter(
                        status=Assignment.Status.PUBLISHED,
                        targets__class_group_id=en.class_group_id,
                    ).values_list("id", flat=True)
                )
                done = set(
                    Submission.objects.filter(
                        student=user,
                        assignment_id__in=asg_ids,
                        status=Submission.Status.PUBLISHED,
                    ).values_list("assignment_id", flat=True)
                )
                pending_hw = len([i for i in asg_ids if i not in done])
                done_hw = len(done)
        return Response(
            {
                "user": me,
                "homework": {"pending": pending_hw, "done": done_hw},
                "server_time": timezone.now().isoformat(),
            }
        )


class CompatClassesMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from schools.models import ClassEnrollment

        if request.user.global_role != "student":
            return Response({"ok": False, "error": "Faqat o‘quvchi."}, status=403)
        en = (
            ClassEnrollment.objects.filter(student=request.user, is_active=True)
            .select_related("class_group", "class_group__school")
            .first()
        )
        if not en:
            return Response({"ok": False, "error": "Sinf topilmadi."}, status=404)
        cg = en.class_group
        count = ClassEnrollment.objects.filter(class_group=cg, is_active=True).count()
        return Response(
            {
                "class_id": cg.id,
                "name": cg.name,
                "grade": cg.grade,
                "school_id": cg.school_id,
                "school_name": cg.school.name,
                "student_count": count,
                "pupil_code": en.pupil_code,
            }
        )
