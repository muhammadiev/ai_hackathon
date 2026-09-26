import json
import hmac
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from games import config as game_config
from games import services
from games.models import GameSession


def _err(e):
    msg = e.messages if hasattr(e, "messages") else [str(e)]
    text = " ".join(msg) if isinstance(msg, list) else str(msg)
    code = (
        status.HTTP_409_CONFLICT
        if "409" in text or "allaqachon" in text.lower()
        else status.HTTP_400_BAD_REQUEST
    )
    # disabled portal → 503 so frontend can show "not working"
    if "ishlamayapti" in text.lower() or "not working" in text.lower() or "not configured" in text.lower():
        code = status.HTTP_503_SERVICE_UNAVAILABLE
    return Response({"ok": False, "error": msg, "game_portal": game_config.status_payload()}, status=code)


class GameStatusView(APIView):
    """Frontend checks this before launching. Empty env → enabled=false."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        st = game_config.status_payload()
        code = 200 if st["enabled"] else 200  # always 200; client reads enabled
        return Response({"ok": True, **st}, status=code)


class GameSessionCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        intent_map = {
            "simple": GameSession.Intent.STUDENT_SIMPLE,
            "student_simple": GameSession.Intent.STUDENT_SIMPLE,
            "homework": GameSession.Intent.STUDENT_HOMEWORK,
            "student_homework": GameSession.Intent.STUDENT_HOMEWORK,
            "create": GameSession.Intent.TEACHER_CREATE,
            "teacher_create": GameSession.Intent.TEACHER_CREATE,
        }
        raw = (request.data.get("intent") or request.data.get("gametype") or "simple").lower()
        intent = intent_map.get(raw)
        if not intent:
            return Response(
                {"ok": False, "error": "intent: simple | homework | create"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            session = services.create_session(
                user=request.user,
                intent=intent,
                assignment_id=request.data.get("assignment_id"),
                locale=request.data.get("locale") or "uz",
            )
        except DjangoValidationError as e:
            return _err(e)
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=400)

        st = game_config.status_payload()
        return Response(
            {
                "ok": True,
                "enabled": True,
                "session_token": session.token,
                "expires_at": session.expires_at,
                "portal_url": st["portal_url"],
                "launch": {
                    "method": "POST",
                    "url": st["portal_url"],
                    "field": "payload",
                    "payload": session.payload,
                },
                "message": st["message_uz"],
            },
            status=status.HTTP_201_CREATED,
        )


class GameSessionDetailView(APIView):
    """Portal may fetch session by token (optional Bearer or token query)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        try:
            session = services.get_valid_session(token)
        except DjangoValidationError as e:
            return _err(e)
        if session.status == GameSession.Status.ISSUED:
            session.status = GameSession.Status.LAUNCHED
            session.save(update_fields=["status"])
        return Response(
            {
                "ok": True,
                "token": session.token,
                "intent": session.intent,
                "status": session.status,
                "payload": session.payload,
                "expires_at": session.expires_at,
            }
        )


@method_decorator(csrf_exempt, name="dispatch")
class GameCallbackView(APIView):
    """
    Server-to-server callback from game portal (local Django or remote).
    Auth: header X-Game-Portal-Secret == GAME_PORTAL_CALLBACK_SECRET
    Body: { "session_token": "...", "result": { score, max_score, ... } }
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        secret = game_config.callback_secret()
        if not secret:
            return Response(
                {
                    "ok": False,
                    "error": "Callback secret not configured (GAME_PORTAL_CALLBACK_SECRET).",
                    "game_portal": game_config.status_payload(),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        got = request.headers.get("X-Game-Portal-Secret", "")
        if not hmac.compare_digest(got, secret):
            return Response(
                {"ok": False, "error": "Unauthorized"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        token = request.data.get("session_token") or request.data.get("token")
        result = request.data.get("result") or request.data
        if not token:
            return Response(
                {"ok": False, "error": "session_token required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            sub = services.apply_callback(token=token, result=result)
        except DjangoValidationError as e:
            return _err(e)
        return Response(
            {
                "ok": True,
                "recorded": sub is not None,
                "submission_id": sub.id if sub else None,
                "score": str(sub.score) if sub else None,
                "status": sub.status if sub else None,
            }
        )
