from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Prefetch

from accounts.permissions import IsTeacherOrAdmin
from accounts.scoping import active_school_ids, teacher_subject_ids
from schools.models import Subject, School
from .models import Question, QuestionVersion
from .serializers import (
    QuestionListSerializer,
    QuestionDetailSerializer,
    QuestionCreateSerializer,
    QuestionUpdateSerializer,
)
from . import services


def _school_for_user(user):
    sids = active_school_ids(user)
    if not sids:
        return None
    return School.objects.filter(pk=sids[0]).first()


def _can_access_question(user, q: Question):
    sids = active_school_ids(user)
    if q.school_id not in sids and user.global_role != "superadmin":
        return False
    if user.global_role == "teacher":
        subj = teacher_subject_ids(user)
        if subj is not None and q.subject_id not in subj:
            return False
    return True


class QuestionListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        user = request.user
        sids = active_school_ids(user)
        qs = Question.objects.filter(school_id__in=sids).select_related("subject")
        if user.global_role == "teacher":
            subj = teacher_subject_ids(user)
            if subj is not None:
                qs = qs.filter(subject_id__in=subj)
        status_f = request.query_params.get("status")
        if status_f:
            qs = qs.filter(status=status_f)
        subject_id = request.query_params.get("subject_id")
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        qtype = request.query_params.get("qtype")
        if qtype:
            qs = qs.filter(qtype=qtype)
        grade = request.query_params.get("grade")
        if grade:
            qs = qs.filter(grade=grade)
        search = request.query_params.get("q")
        if search:
            qs = qs.filter(versions__text__icontains=search).distinct()
        qs = qs.prefetch_related(
            Prefetch(
                "versions",
                queryset=QuestionVersion.objects.order_by("-version"),
            )
        ).order_by("-updated_at")[:100]
        return Response(
            {"count": len(qs), "results": QuestionListSerializer(qs, many=True).data}
        )

    def post(self, request):
        ser = QuestionCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        school = _school_for_user(request.user)
        if not school:
            return Response(
                {"ok": False, "error": "Maktab a’zoligi yo‘q."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        subject = get_object_or_404(Subject, pk=data["subject_id"])
        meta = {
            "qtype": data["qtype"],
            "grade": data.get("grade"),
            "difficulty": data.get("difficulty", 1),
            "xp": data.get("xp", 10),
            "tags": data.get("tags") or [],
            "dtm_eligible": data.get("dtm_eligible", False),
            "status": (
                Question.Status.ACTIVE
                if data.get("publish")
                else Question.Status.DRAFT
            ),
        }
        content = {k: data.get(k) for k in (
            "text", "html", "latex", "options", "answer_key", "correct",
            "explanation", "images", "accepted_answers", "numeric_tolerance",
        )}
        try:
            q = services.create_question(
                school=school,
                subject=subject,
                created_by=request.user,
                meta=meta,
                content=content,
            )
        except DjangoValidationError as e:
            return Response(
                {"ok": False, "error": e.messages if hasattr(e, "messages") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        q = Question.objects.prefetch_related("versions").get(pk=q.pk)
        return Response(
            QuestionDetailSerializer(q).data, status=status.HTTP_201_CREATED
        )


class QuestionDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request, pk):
        q = get_object_or_404(
            Question.objects.select_related("subject").prefetch_related("versions"),
            pk=pk,
        )
        if not _can_access_question(request.user, q):
            return Response(
                {"ok": False, "error": "Ruxsat yo‘q."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(QuestionDetailSerializer(q).data)

    def patch(self, request, pk):
        q = get_object_or_404(Question, pk=pk)
        if not _can_access_question(request.user, q):
            return Response(
                {"ok": False, "error": "Ruxsat yo‘q."},
                status=status.HTTP_403_FORBIDDEN,
            )
        ser = QuestionUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        # merge with current version so partial patch works
        ver = q.versions.filter(version=q.current_version).first()
        base = {
            "text": ver.text if ver else "",
            "html": ver.html if ver else "",
            "latex": ver.latex if ver else "",
            "options": ver.options if ver else [],
            "answer_key": ver.answer_key if ver else {},
            "explanation": ver.explanation if ver else "",
            "images": ver.images if ver else [],
            "accepted_answers": ver.accepted_answers if ver else [],
            "numeric_tolerance": ver.numeric_tolerance if ver else None,
        }
        base.update({k: v for k, v in ser.validated_data.items() if v is not None})
        if "correct" in ser.validated_data and ser.validated_data["correct"] is not None:
            ak = dict(base.get("answer_key") or {})
            ak["correct"] = ser.validated_data["correct"]
            base["answer_key"] = ak
        try:
            q = services.update_question_content(
                question=q, actor=request.user, content=base
            )
        except DjangoValidationError as e:
            return Response(
                {"ok": False, "error": e.messages if hasattr(e, "messages") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        q = Question.objects.prefetch_related("versions").get(pk=q.pk)
        return Response(QuestionDetailSerializer(q).data)


class QuestionPublishView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request, pk):
        q = get_object_or_404(Question, pk=pk)
        if not _can_access_question(request.user, q):
            return Response(
                {"ok": False, "error": "Ruxsat yo‘q."}, status=status.HTTP_403_FORBIDDEN
            )
        try:
            q = services.publish_question(question=q, actor=request.user)
        except DjangoValidationError as e:
            return Response(
                {"ok": False, "error": e.messages if hasattr(e, "messages") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(QuestionDetailSerializer(
            Question.objects.prefetch_related("versions").get(pk=q.pk)
        ).data)


class QuestionArchiveView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request, pk):
        q = get_object_or_404(Question, pk=pk)
        if not _can_access_question(request.user, q):
            return Response(
                {"ok": False, "error": "Ruxsat yo‘q."}, status=status.HTTP_403_FORBIDDEN
            )
        q = services.archive_question(question=q, actor=request.user)
        return Response({"ok": True, "id": q.id, "status": q.status})


class QuestionRestoreView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request, pk):
        q = get_object_or_404(Question, pk=pk)
        if not _can_access_question(request.user, q):
            return Response(
                {"ok": False, "error": "Ruxsat yo‘q."}, status=status.HTTP_403_FORBIDDEN
            )
        try:
            q = services.restore_question(question=q, actor=request.user)
        except DjangoValidationError as e:
            return Response(
                {"ok": False, "error": e.messages if hasattr(e, "messages") else str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"ok": True, "id": q.id, "status": q.status})
