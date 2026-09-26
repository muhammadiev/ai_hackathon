from datetime import date
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from accounts.permissions import IsTeacherOrAdmin
from accounts.scoping import active_school_ids
from schools.models import ClassGroup, School
from insights.models import (
    UnderstandingCheck,
    TopicMastery,
    BaselineSnapshot,
    EffectivenessReport,
    ParentLink,
    ParentWeeklyTip,
    CreatorBalance,
    CreatorReward,
)
from insights import services


def _err(e):
    msg = e.messages if hasattr(e, "messages") else [str(e)]
    return Response({"ok": False, "error": msg}, status=status.HTTP_400_BAD_REQUEST)


# ---- Understanding Check ----
class MyUnderstandingPendingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = UnderstandingCheck.objects.filter(
            student=request.user,
            status__in=["pending", "sent"],
        ).order_by("-created_at")[:10]
        return Response(
            {
                "count": len(qs),
                "results": [
                    {
                        "id": x.id,
                        "prompt_text": x.prompt_text,
                        "window_seconds": x.window_seconds,
                        "expires_at": x.expires_at,
                        "assignment_id": x.assignment_id,
                        "status": x.status,
                    }
                    for x in qs
                ],
            }
        )


class UnderstandingAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        uc = get_object_or_404(UnderstandingCheck, pk=pk, student=request.user)
        try:
            uc = services.answer_understanding_check(
                uc=uc, answer=request.data.get("answer", "")
            )
        except DjangoValidationError as e:
            return _err(e)
        return Response(
            {
                "ok": True,
                "id": uc.id,
                "status": uc.status,
                "outcome": uc.outcome,
                "flag_teacher": uc.flag_teacher,
            }
        )


class TeacherUnderstandingFlagsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        sids = active_school_ids(request.user)
        qs = UnderstandingCheck.objects.filter(
            school_id__in=sids, flag_teacher=True
        ).select_related("student", "assignment")[:50]
        return Response(
            {
                "count": len(qs),
                "results": [
                    {
                        "id": x.id,
                        "student_id": x.student_id,
                        "student": x.student.username,
                        "assignment_id": x.assignment_id,
                        "assignment": x.assignment.title,
                        "outcome": x.outcome,
                        "student_answer": x.student_answer[:200],
                        "created_at": x.created_at,
                    }
                    for x in qs
                ],
            }
        )


# ---- Topic mastery ----
class MyMasteryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = TopicMastery.objects.filter(student=request.user).select_related("subject")
        return Response(
            {
                "count": qs.count(),
                "results": [
                    {
                        "subject": r.subject.name,
                        "topic_key": r.topic_key,
                        "topic_label": r.topic_label,
                        "p_know": str(r.p_know),
                        "attempts": r.attempts,
                        "correct": r.correct,
                        "last_result": r.last_result,
                    }
                    for r in qs
                ],
            }
        )


class ClassMasteryView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request, class_id):
        cg = get_object_or_404(ClassGroup, pk=class_id)
        if cg.school_id not in active_school_ids(request.user):
            if request.user.global_role != "superadmin":
                return Response({"ok": False, "error": "Ruxsat yo‘q."}, status=403)
        student_ids = list(
            cg.enrollments.filter(is_active=True).values_list("student_id", flat=True)
        )
        qs = TopicMastery.objects.filter(student_id__in=student_ids).select_related(
            "student", "subject"
        )[:200]
        return Response(
            {
                "count": len(qs),
                "results": [
                    {
                        "student": r.student.username,
                        "subject": r.subject.name,
                        "topic_label": r.topic_label,
                        "p_know": str(r.p_know),
                        "attempts": r.attempts,
                    }
                    for r in qs
                ],
            }
        )


# ---- Effectiveness ----
class BaselineCreateView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request):
        sids = active_school_ids(request.user)
        school = School.objects.filter(pk=sids[0]).first() if sids else None
        if not school:
            return Response({"ok": False, "error": "Maktab yo‘q."}, status=400)
        cg = get_object_or_404(ClassGroup, pk=request.data.get("class_group_id"))
        try:
            snap = services.create_baseline(
                school=school,
                class_group=cg,
                label=request.data.get("label") or "baseline",
                period_start=date.fromisoformat(request.data["period_start"]),
                period_end=date.fromisoformat(request.data["period_end"]),
                actor=request.user,
            )
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=400)
        return Response(
            {"ok": True, "id": snap.id, "metrics": snap.metrics},
            status=status.HTTP_201_CREATED,
        )


class EffectivenessBeforeAfterView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request):
        sids = active_school_ids(request.user)
        school = School.objects.filter(pk=sids[0]).first() if sids else None
        baseline = get_object_or_404(BaselineSnapshot, pk=request.data.get("baseline_id"))
        report = services.create_before_after_report(
            school=school, baseline=baseline, actor=request.user
        )
        return Response(
            {
                "ok": True,
                "id": report.id,
                "title": report.title,
                "summary": report.summary,
                "narrative": report.narrative,
            },
            status=201,
        )


class EffectivenessABView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request):
        sids = active_school_ids(request.user)
        school = School.objects.filter(pk=sids[0]).first() if sids else None
        a = get_object_or_404(ClassGroup, pk=request.data.get("class_a_id"))
        b = get_object_or_404(ClassGroup, pk=request.data.get("class_b_id"))
        report = services.create_ab_report(
            school=school,
            class_a=a,
            class_b=b,
            period_start=date.fromisoformat(request.data["period_start"]),
            period_end=date.fromisoformat(request.data["period_end"]),
            actor=request.user,
        )
        return Response(
            {
                "ok": True,
                "id": report.id,
                "summary": report.summary,
                "narrative": report.narrative,
            },
            status=201,
        )


class EffectivenessListView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        sids = active_school_ids(request.user)
        qs = EffectivenessReport.objects.filter(school_id__in=sids)[:30]
        return Response(
            {
                "count": len(qs),
                "results": [
                    {
                        "id": r.id,
                        "kind": r.kind,
                        "title": r.title,
                        "narrative": r.narrative,
                        "summary": r.summary,
                        "created_at": r.created_at,
                    }
                    for r in qs
                ],
            }
        )


# ---- Parents ----
class ParentLinkCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # teacher/admin links parent to student; or student self-registers parent phone
        student_id = request.data.get("student_id") or request.user.id
        if request.user.global_role == "student":
            student_id = request.user.id
        link = ParentLink.objects.create(
            student_id=student_id,
            parent_name=request.data.get("parent_name") or "",
            parent_phone=request.data.get("parent_phone") or "",
            telegram_username=request.data.get("telegram_username") or "",
        )
        return Response(
            {"ok": True, "id": link.id, "parent_phone": link.parent_phone},
            status=201,
        )


class ParentTipGenerateView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def post(self, request):
        link = get_object_or_404(ParentLink, pk=request.data.get("parent_link_id"))
        try:
            tip = services.generate_parent_tip(parent_link=link, actor=request.user)
        except DjangoValidationError as e:
            return _err(e)
        return Response(
            {
                "ok": True,
                "id": tip.id,
                "week_key": tip.week_key,
                "title": tip.title,
                "body": tip.body,
                "status": tip.status,
            },
            status=201,
        )


class ParentTipListView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        sids = active_school_ids(request.user)
        qs = ParentWeeklyTip.objects.filter(school_id__in=sids)[:50]
        return Response(
            {
                "count": len(qs),
                "results": [
                    {
                        "id": t.id,
                        "student": t.student.username,
                        "week_key": t.week_key,
                        "title": t.title,
                        "body": t.body,
                        "status": t.status,
                    }
                    for t in qs
                ],
            }
        )


# ---- Offline sync ----
class OfflineSyncView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.global_role != "student":
            return Response({"ok": False, "error": "Faqat o‘quvchi."}, status=403)
        batch_id = request.data.get("client_batch_id") or ""
        items = request.data.get("items") or []
        if not batch_id:
            return Response({"ok": False, "error": "client_batch_id kerak."}, status=400)
        batch = services.apply_offline_sync(
            student=request.user, client_batch_id=batch_id, items=items
        )
        return Response(
            {
                "ok": True,
                "status": batch.status,
                "result": batch.result,
            },
            status=201,
        )


# ---- Creator rewards ----
class CreatorMeView(APIView):
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get(self, request):
        bal, _ = CreatorBalance.objects.get_or_create(teacher=request.user)
        rewards = CreatorReward.objects.filter(teacher=request.user)[:20]
        return Response(
            {
                "points": bal.points,
                "reuse_count": bal.reuse_count,
                "rewards": [
                    {
                        "id": r.id,
                        "kind": r.kind,
                        "points": r.points,
                        "note": r.note,
                        "created_at": r.created_at,
                    }
                    for r in rewards
                ],
            }
        )
