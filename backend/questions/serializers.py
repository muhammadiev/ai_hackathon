from rest_framework import serializers
from .models import Question, QuestionVersion


class QuestionVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionVersion
        fields = (
            "version",
            "text",
            "html",
            "latex",
            "options",
            "answer_key",
            "explanation",
            "images",
            "accepted_answers",
            "numeric_tolerance",
            "created_at",
        )


class QuestionListSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    preview = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = (
            "id",
            "qtype",
            "status",
            "subject",
            "subject_name",
            "grade",
            "difficulty",
            "xp",
            "tags",
            "dtm_eligible",
            "current_version",
            "preview",
            "updated_at",
        )

    def get_preview(self, obj):
        ver = obj.versions.filter(version=obj.current_version).first()
        if not ver:
            return ""
        return (ver.text or "")[:120]


class QuestionDetailSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    current = serializers.SerializerMethodField()
    versions = QuestionVersionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = (
            "id",
            "school",
            "subject",
            "subject_name",
            "qtype",
            "status",
            "grade",
            "difficulty",
            "xp",
            "tags",
            "dtm_eligible",
            "current_version",
            "current",
            "versions",
            "created_at",
            "updated_at",
        )

    def get_current(self, obj):
        ver = obj.versions.filter(version=obj.current_version).first()
        return QuestionVersionSerializer(ver).data if ver else None


class QuestionCreateSerializer(serializers.Serializer):
    subject_id = serializers.IntegerField()
    qtype = serializers.ChoiceField(choices=[c[0] for c in Question.Type.choices])
    grade = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=11)
    difficulty = serializers.IntegerField(required=False, default=1, min_value=1, max_value=5)
    xp = serializers.IntegerField(required=False, default=10, min_value=0)
    tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    dtm_eligible = serializers.BooleanField(required=False, default=False)
    publish = serializers.BooleanField(required=False, default=False)
    # content
    text = serializers.CharField(required=False, allow_blank=True, default="")
    html = serializers.CharField(required=False, allow_blank=True, default="")
    latex = serializers.CharField(required=False, allow_blank=True, default="")
    options = serializers.ListField(required=False, default=list)
    answer_key = serializers.DictField(required=False, default=dict)
    correct = serializers.IntegerField(required=False, allow_null=True)
    explanation = serializers.CharField(required=False, allow_blank=True, default="")
    images = serializers.ListField(required=False, default=list)
    accepted_answers = serializers.ListField(required=False, default=list)
    numeric_tolerance = serializers.FloatField(required=False, allow_null=True)


class QuestionUpdateSerializer(serializers.Serializer):
    text = serializers.CharField(required=False, allow_blank=True)
    html = serializers.CharField(required=False, allow_blank=True)
    latex = serializers.CharField(required=False, allow_blank=True)
    options = serializers.ListField(required=False)
    answer_key = serializers.DictField(required=False)
    correct = serializers.IntegerField(required=False, allow_null=True)
    explanation = serializers.CharField(required=False, allow_blank=True)
    images = serializers.ListField(required=False)
    accepted_answers = serializers.ListField(required=False)
    numeric_tolerance = serializers.FloatField(required=False, allow_null=True)
