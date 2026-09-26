from rest_framework import serializers
from .models import Submission, Answer


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = (
            "question_index",
            "question_id",
            "question_version",
            "response",
            "is_correct",
            "points",
            "max_points",
        )


class SubmissionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    assignment_title = serializers.CharField(
        source="assignment.title", read_only=True
    )
    student_username = serializers.CharField(source="student.username", read_only=True)

    class Meta:
        model = Submission
        fields = (
            "id",
            "student",
            "student_username",
            "assignment",
            "assignment_title",
            "attempt_no",
            "source",
            "status",
            "score",
            "max_score",
            "is_late",
            "started_at",
            "submitted_at",
            "graded_at",
            "answers",
        )


class DigitalStartSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()


class DigitalAnswerSerializer(serializers.Serializer):
    question_index = serializers.IntegerField(min_value=0)
    response = serializers.JSONField()


class DigitalFinishSerializer(serializers.Serializer):
    answers = serializers.ListField(child=DigitalAnswerSerializer(), min_length=0)
