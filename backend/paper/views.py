from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError

from accounts.permissions import IsTeacherOrAdmin
from accounts.scoping import (
    assert_teacher_can_access_assignment,
    assert_teacher_can_access_class,
)
from assignments.models import Assignment
from schools.models import ClassGroup, ClassEnrollment
from .models import PaperBatch, ScanJob, ScanAnswer
from .serializers import (
    PaperBatchSerializer,
    PaperBatchCreateSerializer,
    ScanJobSerializer,
    ScanCreateSerializer,
    ScanPatchSerializer,
    ScanConfirmSerializer,
)
from . import services


def _validation_response(e: DjangoValidationError):
    msg = e.messages if hasattr(e, "messages") else [str(e)]
    text = " ".join(msg) if isinstance(msg, list) else str(msg)
    code = (
        status.HTTP_409_CONFLICT
        if "409" in text or "allaqachon" in text.lower()
        else status.HTTP_400_BAD_REQUEST
    )
    return Response({"ok": False, "error": msg}, status=code)


class PaperBatchCreateView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request):
        ser = PaperBatchCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        assignment = get_object_or_404(Assignment, pk=data["assignment_id"])
        class_group = get_object_or_404(ClassGroup, pk=data["class_group_id"])
        assert_teacher_can_access_assignment(request.user, assignment)
        assert_teacher_can_access_class(request.user, class_group.id)
        try:
            batch = services.create_paper_batch(
                assignment=assignment,
                class_group=class_group,
                student_ids=data["student_ids"],
                personalized=data["personalized"],
                created_by=request.user,
            )
        except DjangoValidationError as e:
            return _validation_response(e)
        return Response(
            PaperBatchSerializer(batch).data, status=status.HTTP_201_CREATED
        )


class PaperBatchDetailView(generics.RetrieveAPIView):
    queryset = PaperBatch.objects.prefetch_related("students")
    serializer_class = PaperBatchSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_object(self):
        obj = super().get_object()
        assert_teacher_can_access_assignment(self.request.user, obj.assignment)
        return obj


class PaperBatchPrintView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request, pk):
        batch = get_object_or_404(
            PaperBatch.objects.prefetch_related("students").select_related(
                "assignment"
            ),
            pk=pk,
        )
        assert_teacher_can_access_assignment(request.user, batch.assignment)
        mode = request.query_params.get("mode", "answers")
        letters = "ABCDE"
        questions = batch.questions
        payload = {
            "batch_id": batch.id,
            "code": batch.code,
            "title": batch.title,
            "class_id": batch.class_group_id,
            "personalized": batch.personalized,
            "mode": mode,
        }
        if mode == "questions":
            payload["questions"] = [
                {
                    "index": i + 1,
                    "text": q.get("text"),
                    "html": q.get("html"),
                    "options": q.get("options", []),
                }
                for i, q in enumerate(questions)
            ]
        elif mode == "key":
            payload["key"] = []
            for i, q in enumerate(questions):
                correct = q.get("correct")
                if correct is None and isinstance(q.get("answer_key"), dict):
                    correct = q["answer_key"].get("correct")
                letter = (
                    letters[correct]
                    if isinstance(correct, int) and 0 <= correct < len(letters)
                    else "?"
                )
                payload["key"].append({"index": i + 1, "letter": letter})
        else:
            payload["students"] = [
                {
                    "student_id": s.student_id,
                    "name": s.student_name,
                    "pupil_code": s.pupil_code,
                }
                for s in batch.students.all()
            ]
            payload["question_count"] = len(questions)
            payload["options_per_question"] = [
                len(q.get("options") or []) for q in questions
            ]
        return Response(payload)


class ScanCreateView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request):
        ser = ScanCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        assignment = get_object_or_404(Assignment, pk=data["assignment_id"])
        assert_teacher_can_access_assignment(request.user, assignment)
        batch = None
        if data.get("batch_id"):
            batch = get_object_or_404(PaperBatch, pk=data["batch_id"])
            if batch.assignment_id != assignment.id:
                return Response(
                    {"ok": False, "error": "Batch boshqa vazifaga tegishli."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        student_id = data.get("student_id")
        pupil_code = (data.get("pupil_code") or "").strip()
        if not student_id and pupil_code and batch:
            sheet = batch.students.filter(pupil_code=pupil_code).first()
            if sheet:
                student_id = sheet.student_id
        scan = ScanJob.objects.create(
            school=assignment.school,
            batch=batch,
            assignment=assignment,
            student_id=student_id,
            pupil_code=pupil_code,
            uploaded_by=request.user,
            file_ids=data["file_ids"],
            status=ScanJob.Status.NEEDS_REVIEW,
        )
        qs = batch.questions if batch else (assignment.question_snapshot or [])
        ScanAnswer.objects.bulk_create(
            [
                ScanAnswer(
                    scan=scan,
                    question_index=i,
                    marked=[],
                    is_resolved=False,
                )
                for i in range(len(qs))
            ]
        )
        scan = ScanJob.objects.prefetch_related("answers").get(pk=scan.pk)
        return Response(
            ScanJobSerializer(scan).data, status=status.HTTP_201_CREATED
        )


class ScanDetailView(generics.RetrieveAPIView):
    queryset = ScanJob.objects.prefetch_related("answers").select_related(
        "assignment"
    )
    serializer_class = ScanJobSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_object(self):
        obj = super().get_object()
        assert_teacher_can_access_assignment(self.request.user, obj.assignment)
        return obj


class ScanPatchView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def patch(self, request, pk):
        scan = get_object_or_404(
            ScanJob.objects.prefetch_related("answers").select_related(
                "assignment", "batch"
            ),
            pk=pk,
        )
        assert_teacher_can_access_assignment(request.user, scan.assignment)
        if scan.status == ScanJob.Status.CONFIRMED:
            return Response(
                {"ok": False, "error": "Tasdiqlangan skanni o‘zgartirib bo‘lmaydi."},
                status=status.HTTP_409_CONFLICT,
            )
        ser = ScanPatchSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        if "student_id" in data:
            scan.student_id = data["student_id"]
        if "pupil_code" in data:
            scan.pupil_code = data["pupil_code"]
            if scan.batch_id and data["pupil_code"]:
                sheet = scan.batch.students.filter(
                    pupil_code=data["pupil_code"]
                ).first()
                if sheet:
                    scan.student_id = sheet.student_id
        if "review_notes" in data:
            scan.review_notes = data["review_notes"]
        scan.save()
        for item in data.get("answers") or []:
            idx = item.get("question_index")
            ans = scan.answers.filter(question_index=idx).first()
            if not ans:
                continue
            if "final_mark" in item:
                ans.final_mark = item["final_mark"]
                ans.is_resolved = bool(item["final_mark"])
            if "marked" in item:
                ans.marked = item["marked"]
            if "is_resolved" in item:
                ans.is_resolved = item["is_resolved"]
            ans.save()
        scan = ScanJob.objects.prefetch_related("answers").get(pk=scan.pk)
        return Response(ScanJobSerializer(scan).data)


class ScanConfirmView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request, pk):
        scan = get_object_or_404(
            ScanJob.objects.select_related("assignment"), pk=pk
        )
        assert_teacher_can_access_assignment(request.user, scan.assignment)
        ser = ScanConfirmSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            sub = services.confirm_scan(
                scan=scan,
                teacher=request.user,
                publish=ser.validated_data.get("publish", True),
            )
        except DjangoValidationError as e:
            return _validation_response(e)
        return Response(
            {
                "ok": True,
                "submission_id": sub.id,
                "score": str(sub.score),
                "max_score": str(sub.max_score),
                "status": sub.status,
            }
        )


class RosterCodesView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        class_id = request.query_params.get("class_id")
        if not class_id:
            return Response(
                {"ok": False, "error": "class_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        assert_teacher_can_access_class(request.user, int(class_id))
        rows = ClassEnrollment.objects.filter(
            class_group_id=class_id, is_active=True
        ).select_related("student", "student__profile")
        data = []
        for en in rows:
            name = (
                en.student.profile.full_name
                if hasattr(en.student, "profile") and en.student.profile
                else en.student.username
            )
            data.append(
                {
                    "student_id": en.student_id,
                    "name": name or en.student.username,
                    "pupil_code": en.pupil_code,
                }
            )
        return Response({"results": data})
