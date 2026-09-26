import hashlib
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from accounts.scoping import active_school_ids
from schools.models import School
from .models import StoredFile
from .serializers import StoredFileSerializer

# 10 MB default
MAX_BYTES = 10 * 1024 * 1024
ALLOWED_KINDS = {c[0] for c in StoredFile.Kind.choices}


class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        f = request.FILES.get("file")
        if not f:
            return Response(
                {"ok": False, "error": "file maydoni majburiy."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if f.size > MAX_BYTES:
            return Response(
                {"ok": False, "error": "Fayl 10 MB dan katta."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        kind = request.data.get("kind") or StoredFile.Kind.OTHER
        if kind not in ALLOWED_KINDS:
            return Response(
                {"ok": False, "error": f"Noto‘g‘ri kind. Ruxsat: {sorted(ALLOWED_KINDS)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        school = None
        sids = active_school_ids(request.user)
        if sids:
            school = School.objects.filter(pk=sids[0]).first()

        h = hashlib.sha256()
        for chunk in f.chunks():
            h.update(chunk)
        f.seek(0)

        sf = StoredFile(
            uploaded_by=request.user,
            school=school,
            kind=kind,
            status=StoredFile.Status.READY,
            original_name=getattr(f, "name", "")[:255],
            content_type=getattr(f, "content_type", "") or "",
            size_bytes=f.size,
            checksum_sha256=h.hexdigest(),
            finalized_at=timezone.now(),
        )
        sf.file.save(f.name, f, save=True)
        return Response(
            StoredFileSerializer(sf, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class FileDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            sf = StoredFile.objects.get(pk=pk, status=StoredFile.Status.READY)
        except StoredFile.DoesNotExist:
            return Response(
                {"ok": False, "error": "Topilmadi."},
                status=status.HTTP_404_NOT_FOUND,
            )
        # basic ACL: uploader, same school staff, or superadmin
        user = request.user
        if user.global_role == "superadmin":
            pass
        elif sf.uploaded_by_id == user.id:
            pass
        elif sf.school_id and sf.school_id in active_school_ids(user):
            if user.global_role not in ("teacher", "admin", "superadmin"):
                # students only own uploads for now
                if sf.uploaded_by_id != user.id:
                    return Response(
                        {"ok": False, "error": "Ruxsat yo‘q."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
        else:
            return Response(
                {"ok": False, "error": "Ruxsat yo‘q."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(StoredFileSerializer(sf, context={"request": request}).data)
