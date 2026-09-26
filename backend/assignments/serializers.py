from rest_framework import serializers
from .models import Assignment, AssignmentTarget


class AssignmentTargetSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source="class_group.name", read_only=True)

    class Meta:
        model = AssignmentTarget
        fields = ("id", "class_group", "class_name")


class AssignmentListSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    target_count = serializers.IntegerField(source="targets.count", read_only=True)

    class Meta:
        model = Assignment
        fields = (
            "id",
            "title",
            "kind",
            "status",
            "subject",
            "subject_name",
            "lesson_date",
            "deadline",
            "max_score",
            "target_count",
            "created_at",
            "published_at",
        )


class AssignmentDetailSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    targets = AssignmentTargetSerializer(many=True, read_only=True)
    # question_snapshot includes keys for staff only — view strips for students
    question_snapshot = serializers.JSONField(read_only=True)

    class Meta:
        model = Assignment
        fields = (
            "id",
            "school",
            "subject",
            "subject_name",
            "title",
            "kind",
            "status",
            "lesson_date",
            "deadline",
            "question_snapshot",
            "rubric",
            "ai_grade_policy",
            "max_score",
            "allow_late",
            "targets",
            "created_at",
            "updated_at",
            "published_at",
        )


class AssignmentCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    subject_id = serializers.IntegerField()
    kind = serializers.ChoiceField(
        choices=["test", "practical", "mixed"], default="test"
    )
    lesson_date = serializers.DateField(required=False, allow_null=True)
    deadline = serializers.DateTimeField(required=False, allow_null=True)
    class_group_ids = serializers.ListField(
        child=serializers.IntegerField(), min_length=1
    )
    question_snapshot = serializers.ListField(required=False, default=list)
    rubric = serializers.DictField(required=False, default=dict)
    max_score = serializers.DecimalField(
        max_digits=8, decimal_places=2, required=False, default=100
    )
    allow_late = serializers.BooleanField(default=True)
    ai_grade_policy = serializers.CharField(required=False, default="manual")


class AssignmentPublishSerializer(serializers.Serializer):
    confirm = serializers.BooleanField(default=True)
