from rest_framework import serializers
from .models import StoredFile


class StoredFileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = StoredFile
        fields = (
            "id",
            "kind",
            "status",
            "original_name",
            "content_type",
            "size_bytes",
            "checksum_sha256",
            "url",
            "created_at",
            "finalized_at",
        )

    def get_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        if obj.file:
            return obj.file.url
        return None
