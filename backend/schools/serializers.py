from rest_framework import serializers
from .models import (
    School,
    AcademicYear,
    Subject,
    ClassGroup,
    ClassEnrollment,
    TeacherAssignment,
)


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ("id", "name", "code", "timezone", "is_active")


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ("id", "school", "label", "starts_on", "ends_on", "is_current")


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ("id", "school", "code", "name", "name_ru", "is_active")


class ClassGroupSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source="school.name", read_only=True)

    class Meta:
        model = ClassGroup
        fields = (
            "id",
            "school",
            "school_name",
            "academic_year",
            "name",
            "grade",
            "is_active",
        )


class StudentRosterSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source="student.id")
    username = serializers.CharField(source="student.username")
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = ClassEnrollment
        fields = (
            "id",
            "student_id",
            "username",
            "full_name",
            "pupil_code",
            "is_active",
        )

    def get_full_name(self, obj):
        if hasattr(obj.student, "profile") and obj.student.profile.full_name:
            return obj.student.profile.full_name
        return obj.student.get_full_name() or obj.student.username


class TeacherAssignmentSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source="class_group.name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    class Meta:
        model = TeacherAssignment
        fields = (
            "id",
            "teacher",
            "class_group",
            "class_name",
            "subject",
            "subject_name",
            "academic_year",
            "is_active",
        )
