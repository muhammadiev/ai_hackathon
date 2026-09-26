from rest_framework import serializers
from .models import PaperBatch, PaperSheetStudent, ScanJob, ScanAnswer


class PaperSheetStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaperSheetStudent
        fields = ("student", "pupil_code", "student_name")


class PaperBatchSerializer(serializers.ModelSerializer):
    students = PaperSheetStudentSerializer(many=True, read_only=True)

    class Meta:
        model = PaperBatch
        fields = (
            "id",
            "school",
            "assignment",
            "class_group",
            "code",
            "personalized",
            "title",
            "questions",
            "students",
            "created_at",
        )
        read_only_fields = ("code", "questions", "created_at")


class PaperBatchCreateSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()
    class_group_id = serializers.IntegerField()
    student_ids = serializers.ListField(
        child=serializers.IntegerField(), min_length=1
    )
    personalized = serializers.BooleanField(default=True)


class ScanAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanAnswer
        fields = (
            "id",
            "question_index",
            "marked",
            "confidence",
            "is_resolved",
            "final_mark",
        )


class ScanJobSerializer(serializers.ModelSerializer):
    answers = ScanAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = ScanJob
        fields = (
            "id",
            "school",
            "batch",
            "assignment",
            "student",
            "pupil_code",
            "status",
            "file_ids",
            "omr_raw",
            "confidence_avg",
            "review_notes",
            "submission",
            "answers",
            "created_at",
            "confirmed_at",
        )
        read_only_fields = (
            "status",
            "omr_raw",
            "confidence_avg",
            "submission",
            "confirmed_at",
        )


class ScanCreateSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()
    batch_id = serializers.IntegerField(required=False, allow_null=True)
    pupil_code = serializers.CharField(max_length=6, required=False, allow_blank=True)
    student_id = serializers.IntegerField(required=False, allow_null=True)
    file_ids = serializers.ListField(
        child=serializers.IntegerField(), min_length=1
    )


class ScanPatchSerializer(serializers.Serializer):
    student_id = serializers.IntegerField(required=False)
    pupil_code = serializers.CharField(max_length=6, required=False)
    review_notes = serializers.CharField(required=False, allow_blank=True)
    answers = serializers.ListField(required=False)


class ScanConfirmSerializer(serializers.Serializer):
    publish = serializers.BooleanField(default=True)
