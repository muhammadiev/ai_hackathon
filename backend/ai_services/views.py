from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import uuid

from ai_services.client import generate_questions
from config.providers import ai_config, all_provider_status


class AIGenerationJobView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.global_role not in ("teacher", "admin", "superadmin"):
            return Response({"ok": False, "error": "Ruxsat yo‘q."}, status=403)
        job_id = str(uuid.uuid4())
        result = generate_questions(
            subject=str(request.data.get("subject_id") or request.data.get("subject") or ""),
            prompt=request.data.get("prompt") or "",
            n=int(request.data.get("count") or 3),
        )
        return Response(
            {
                "ok": True,
                "job_id": job_id,
                "status": "review_ready",
                **result,
            },
            status=201,
        )


class AIJobStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        cfg = ai_config()
        return Response(
            {
                "job_id": job_id,
                "status": "review_ready",
                **cfg.status(),
            }
        )


class ProvidersStatusView(APIView):
    """Public-ish status for admin UI — no secrets leaked."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.global_role not in ("admin", "superadmin", "teacher"):
            return Response({"ok": False, "error": "Ruxsat yo‘q."}, status=403)
        return Response(all_provider_status())
