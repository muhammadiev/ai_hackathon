from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from accounts.permissions import IsTeacherOrAdmin
from accounts.scoping import active_school_ids
from schools.models import School
from curriculum.models import Course, Topic, Video, Exam
from curriculum import services


class CourseListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sids = active_school_ids(request.user)
        qs = Course.objects.filter(school_id__in=sids, is_published=True)
        subject = request.query_params.get("subject")
        if subject:
            qs = qs.filter(subject_id=subject)
        qs = qs.select_related("subject")[:100]
        return Response(
            {
                "count": len(qs),
                "results": [
                    {
                        "id": c.id,
                        "title": c.title,
                        "subject_id": c.subject_id,
                        "subject": c.subject.name,
                        "grade": c.grade,
                        "description": c.description,
                    }
                    for c in qs
                ],
            }
        )

    def post(self, request):
        if request.user.global_role not in ("teacher", "admin", "superadmin"):
            return Response({"ok": False, "error": "Ruxsat yo‘q."}, status=403)
        sids = active_school_ids(request.user)
        school = School.objects.filter(pk=sids[0]).first() if sids else None
        if not school:
            return Response({"ok": False, "error": "Maktab yo‘q."}, status=400)
        c = Course.objects.create(
            school=school,
            subject_id=request.data.get("subject_id"),
            title=request.data.get("title") or "Kurs",
            description=request.data.get("description") or "",
            grade=request.data.get("grade"),
            created_by=request.user,
        )
        return Response({"id": c.id, "title": c.title}, status=201)


class CourseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        c = get_object_or_404(Course, pk=pk)
        topics = list(c.topics.all())
        return Response(
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "subject_id": c.subject_id,
                "topics": [
                    {"id": t.id, "title": t.title, "order": t.order, "summary": t.summary}
                    for t in topics
                ],
            }
        )


class VideoListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sids = active_school_ids(request.user)
        qs = Video.objects.filter(school_id__in=sids, is_published=True)
        subject = request.query_params.get("subject")
        if subject:
            qs = qs.filter(subject_id=subject)
        qs = qs[:100]
        out = []
        for v in qs:
            can = services.can_watch(request.user, v)
            out.append(
                {
                    "id": v.id,
                    "title": v.title,
                    "subject_id": v.subject_id,
                    "is_free": v.is_free,
                    "price": str(v.price),
                    "can_watch": can,
                    "duration_seconds": v.duration_seconds,
                    "stream_url": v.stream_url if can else "",
                }
            )
        return Response({"count": len(out), "results": out})

    def post(self, request):
        if request.user.global_role not in ("teacher", "admin", "superadmin"):
            return Response({"ok": False, "error": "Ruxsat yo‘q."}, status=403)
        sids = active_school_ids(request.user)
        school = School.objects.filter(pk=sids[0]).first() if sids else None
        v = Video.objects.create(
            school=school,
            subject_id=request.data.get("subject_id"),
            title=request.data.get("title") or "Video",
            description=request.data.get("description") or "",
            stream_url=request.data.get("stream_url") or "",
            duration_seconds=int(request.data.get("duration_seconds") or 0),
            is_free=bool(request.data.get("is_free", True)),
            price=request.data.get("price") or 0,
            created_by=request.user,
        )
        return Response({"id": v.id, "title": v.title}, status=201)


class VideoPurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        v = get_object_or_404(Video, pk=pk)
        try:
            services.purchase_video(user=request.user, video=v)
        except DjangoValidationError as e:
            msg = e.messages if hasattr(e, "messages") else [str(e)]
            return Response({"ok": False, "error": msg}, status=400)
        return Response({"ok": True, "can_watch": True, "demo": True})


class ExamListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sids = active_school_ids(request.user)
        qs = Exam.objects.filter(school_id__in=sids, is_published=True)
        et = request.query_params.get("type")
        if et:
            qs = qs.filter(exam_type=et)
        qs = qs[:100]
        return Response(
            {
                "count": len(qs),
                "results": [
                    {
                        "id": e.id,
                        "type": e.exam_type,
                        "title": e.title,
                        "description": e.description,
                        "duration_minutes": e.duration_minutes,
                        "subject_id": e.subject_id,
                    }
                    for e in qs
                ],
            }
        )

    def post(self, request):
        if request.user.global_role not in ("teacher", "admin", "superadmin"):
            return Response({"ok": False, "error": "Ruxsat yo‘q."}, status=403)
        sids = active_school_ids(request.user)
        school = School.objects.filter(pk=sids[0]).first() if sids else None
        e = Exam.objects.create(
            school=school,
            exam_type=request.data.get("type") or request.data.get("exam_type") or "dtm",
            title=request.data.get("title") or "Imtihon",
            description=request.data.get("description") or "",
            subject_id=request.data.get("subject_id"),
            question_snapshot=request.data.get("question_snapshot") or [],
            duration_minutes=int(request.data.get("duration_minutes") or 60),
        )
        return Response({"id": e.id, "title": e.title, "type": e.exam_type}, status=201)


class ExamDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        e = get_object_or_404(Exam, pk=pk)
        # Students: strip keys from snapshot
        snap = e.question_snapshot or []
        if request.user.global_role == "student":
            snap = [
                {k: v for k, v in q.items() if k not in ("correct", "answer_key", "answer")}
                for q in snap
            ]
        return Response(
            {
                "id": e.id,
                "type": e.exam_type,
                "title": e.title,
                "description": e.description,
                "duration_minutes": e.duration_minutes,
                "question_snapshot": snap,
            }
        )
