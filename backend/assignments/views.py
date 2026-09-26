from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q, Prefetch

from accounts.permissions import IsTeacherOrAdmin
from accounts.scoping import (
    active_school_ids,
    teacher_class_ids,
    teacher_subject_ids,
    assert_teacher_can_access_assignment,
    student_class_enrollment,
)
from .models import Assignment
from .serializers import (
    AssignmentListSerializer,
    AssignmentDetailSerializer,
    AssignmentCreateSerializer,
    AssignmentPublishSerializer,
)
from . import services


def _strip_keys_for_student(snapshot: list) -> list:
    safe = []
    for q in snapshot or []:
        item = {
            "id": q.get("id") or q.get("question_id"),
            "version": q.get("version"),
            "text": q.get("text"),
            "html": q.get("html"),
            "latex": q.get("latex"),
            "options": q.get("options") or [],
            "qtype": q.get("qtype") or q.get("type") or "single",
            "points": q.get("points", 1),
            "images": q.get("images") or [],
        }
        safe.append(item)
    return safe


class AssignmentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = Assignment.objects.select_related("subject").prefetch_related("targets")
        if user.global_role == "student":
            en = student_class_enrollment(user)
            if not en:
                return Response({"count": 0, "results": []})
            qs = qs.filter(
                status=Assignment.Status.PUBLISHED,
                targets__class_group_id=en.class_group_id,
            ).distinct()
        elif user.global_role == "teacher":
            cids = teacher_class_ids(user)
            sids = teacher_subject_ids(user)
            qs = qs.filter(targets__class_group_id__in=cids)
            if sids is not None:
                qs = qs.filter(subject_id__in=sids)
            qs = qs.distinct()
        else:
            schools = active_school_ids(user)
            qs = qs.filter(school_id__in=schools)

        status_f = request.query_params.get("status")
        if status_f:
            qs = qs.filter(status=status_f)
        kind_f = request.query_params.get("kind")
        if kind_f:
            qs = qs.filter(kind=kind_f)
        class_id = request.query_params.get("class_id")
        if class_id:
            qs = qs.filter(targets__class_group_id=class_id).distinct()

        qs = qs.order_by("-lesson_date", "-created_at")[:100]
        return Response(
            {
                "count": len(qs),
                "results": AssignmentListSerializer(qs, many=True).data,
            }
        )

    def post(self, request):
        if request.user.global_role not in ("teacher", "admin", "superadmin"):
            return Response(
                {"ok": False, "error": "Ruxsat yo‘q."},
                status=status.HTTP_403_FORBIDDEN,
            )
        ser = AssignmentCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        schools = active_school_ids(request.user)
        if not schools:
            return Response(
                {"ok": False, "error": "Maktab a’zoligingiz yo‘q."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from schools.models import School

        school = School.objects.get(pk=schools[0])
        try:
            asg = services.create_assignment(
                school=school, created_by=request.user, data=ser.validated_data
            )
        except DjangoValidationError as e:
            return Response(
                {"ok": False, "error": e.messages if hasattr(e, "messages") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        asg = Assignment.objects.prefetch_related("targets").get(pk=asg.pk)
        return Response(
            AssignmentDetailSerializer(asg).data, status=status.HTTP_201_CREATED
        )


class AssignmentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        asg = get_object_or_404(
            Assignment.objects.select_related("subject").prefetch_related("targets"),
            pk=pk,
        )
        user = request.user
        if user.global_role == "student":
            if asg.status != Assignment.Status.PUBLISHED:
                return Response(
                    {"ok": False, "error": "Topilmadi."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            en = student_class_enrollment(user)
            if not en or not asg.targets.filter(
                class_group_id=en.class_group_id
            ).exists():
                return Response(
                    {"ok": False, "error": "Ruxsat yo‘q."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            data = AssignmentDetailSerializer(asg).data
            data["question_snapshot"] = _strip_keys_for_student(
                asg.question_snapshot
            )
            data.pop("rubric", None)
            return Response(data)
        assert_teacher_can_access_assignment(user, asg)
        return Response(AssignmentDetailSerializer(asg).data)


class AssignmentPublishView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request, pk):
        asg = get_object_or_404(Assignment, pk=pk)
        assert_teacher_can_access_assignment(request.user, asg)
        ser = AssignmentPublishSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            asg = services.publish_assignment(assignment=asg, actor=request.user)
        except DjangoValidationError as e:
            return Response(
                {"ok": False, "error": e.messages if hasattr(e, "messages") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(AssignmentDetailSerializer(asg).data)
