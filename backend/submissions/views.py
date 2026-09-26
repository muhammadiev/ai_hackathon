from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError

from accounts.permissions import IsTeacherOrAdmin
from accounts.scoping import (
    assert_teacher_can_access_assignment,
    student_class_enrollment,
    teacher_class_ids,
)
from assignments.models import Assignment
from .models import Submission
from .serializers import (
    SubmissionSerializer,
    DigitalStartSerializer,
    DigitalFinishSerializer,
)
from . import services


class SubmissionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = Submission.objects.select_related(
            "assignment", "student"
        ).prefetch_related("answers")
        assignment_id = request.query_params.get("assignment_id")
        if assignment_id:
            qs = qs.filter(assignment_id=assignment_id)

        if user.global_role == "student":
            qs = qs.filter(student=user, status=Submission.Status.PUBLISHED)
        else:
            if assignment_id:
                asg = get_object_or_404(Assignment, pk=assignment_id)
                assert_teacher_can_access_assignment(user, asg)
            else:
                cids = teacher_class_ids(user)
                qs = qs.filter(
                    assignment__targets__class_group_id__in=cids
                ).distinct()

        qs = qs.order_by("-submitted_at", "-id")[:200]
        return Response(
            {"count": len(qs), "results": SubmissionSerializer(qs, many=True).data}
        )


class DigitalStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.global_role != "student":
            return Response(
                {"ok": False, "error": "Faqat o‘quvchi."},
                status=status.HTTP_403_FORBIDDEN,
            )
        ser = DigitalStartSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            sub = services.start_digital(
                student=request.user,
                assignment_id=ser.validated_data["assignment_id"],
            )
        except DjangoValidationError as e:
            return Response(
                {"ok": False, "error": e.messages if hasattr(e, "messages") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Assignment.DoesNotExist:
            return Response(
                {"ok": False, "error": "Vazifa topilmadi."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(SubmissionSerializer(sub).data, status=status.HTTP_201_CREATED)


class DigitalFinishView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.global_role != "student":
            return Response(
                {"ok": False, "error": "Faqat o‘quvchi."},
                status=status.HTTP_403_FORBIDDEN,
            )
        ser = DigitalFinishSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            sub = services.finish_digital(
                student=request.user,
                submission_id=pk,
                answers_payload=ser.validated_data["answers"],
            )
        except Submission.DoesNotExist:
            return Response(
                {"ok": False, "error": "Topilmadi."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except DjangoValidationError as e:
            msg = e.messages if hasattr(e, "messages") else [str(e)]
            text = " ".join(msg)
            code = (
                status.HTTP_409_CONFLICT
                if "allaqachon" in text.lower()
                else status.HTTP_400_BAD_REQUEST
            )
            return Response({"ok": False, "error": msg}, status=code)
        sub = Submission.objects.prefetch_related("answers").get(pk=sub.pk)
        return Response(SubmissionSerializer(sub).data)


class AssignmentResultsView(APIView):
    """Teacher: all results for an assignment keyed by student_id."""

    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request, assignment_id):
        asg = get_object_or_404(Assignment, pk=assignment_id)
        assert_teacher_can_access_assignment(request.user, asg)
        qs = (
            Submission.objects.filter(
                assignment=asg, status=Submission.Status.PUBLISHED
            )
            .select_related("student", "student__profile")
            .order_by("student_id", "-attempt_no")
        )
        # one row per student (latest published — unique constraint guarantees one)
        results = []
        for s in qs:
            name = (
                s.student.profile.full_name
                if hasattr(s.student, "profile") and s.student.profile
                else s.student.username
            )
            results.append(
                {
                    "student_id": s.student_id,
                    "student_name": name,
                    "submission_id": s.id,
                    "source": s.source,
                    "score": str(s.score),
                    "max_score": str(s.max_score),
                    "is_late": s.is_late,
                    "submitted_at": s.submitted_at,
                    "attempt_no": s.attempt_no,
                }
            )
        return Response(
            {
                "assignment_id": asg.id,
                "title": asg.title,
                "count": len(results),
                "results": results,
            }
        )
