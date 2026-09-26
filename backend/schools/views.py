from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import ClassGroup, ClassEnrollment, Subject, TeacherAssignment
from .serializers import (
    ClassGroupSerializer,
    StudentRosterSerializer,
    SubjectSerializer,
    TeacherAssignmentSerializer,
)
from accounts.permissions import IsTeacherOrAdmin


class MyClassesView(generics.ListAPIView):
    """Teacher: assigned classes. Admin: all school classes."""

    serializer_class = ClassGroupSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.global_role in ("admin", "superadmin"):
            school_ids = user.memberships.filter(is_active=True).values_list(
                "school_id", flat=True
            )
            return ClassGroup.objects.filter(
                school_id__in=school_ids, is_active=True
            ).select_related("school", "academic_year")
        # teacher
        class_ids = TeacherAssignment.objects.filter(
            teacher=user, is_active=True
        ).values_list("class_group_id", flat=True)
        return ClassGroup.objects.filter(
            id__in=class_ids, is_active=True
        ).select_related("school", "academic_year")


class ClassStudentsView(generics.ListAPIView):
    serializer_class = StudentRosterSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        class_id = self.kwargs["class_id"]
        return ClassEnrollment.objects.filter(
            class_group_id=class_id, is_active=True
        ).select_related("student", "student__profile")


class SubjectListView(generics.ListAPIView):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        school_ids = user.memberships.filter(is_active=True).values_list(
            "school_id", flat=True
        )
        return Subject.objects.filter(
            Q(school_id__in=school_ids) | Q(school__isnull=True), is_active=True
        )


class MyTeacherAssignmentsView(generics.ListAPIView):
    serializer_class = TeacherAssignmentSerializer
    permission_classes = [IsAuthenticated, IsTeacherOrAdmin]

    def get_queryset(self):
        return TeacherAssignment.objects.filter(
            teacher=self.request.user, is_active=True
        ).select_related("class_group", "subject", "academic_year")
