from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.auth import MiraeTokenObtainPairView
from rest_framework.throttling import AnonRateThrottle


class LoginThrottle(AnonRateThrottle):
    scope = "login"


class ThrottledTokenObtainPairView(MiraeTokenObtainPairView):
    throttle_classes = [LoginThrottle]


def health(request):
    db_ok = False
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception:
        db_ok = False
    status_code = 200 if db_ok else 503
    from games import config as game_config
    gp = game_config.status_payload()
    return JsonResponse(
        {
            "ok": db_ok,
            "service": "mirae-maktab-api",
            "database": "up" if db_ok else "down",
            "game_portal": {"enabled": gp["enabled"], "message": gp["message"]},
        },
        status=status_code,
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/health/", health),
    path(
        "api/v1/auth/token/",
        ThrottledTokenObtainPairView.as_view(),
        name="token_obtain",
    ),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/", include("accounts.urls")),
    path("api/v1/", include("schools.urls")),
    path("api/v1/", include("assignments.urls")),
    path("api/v1/", include("submissions.urls")),
    path("api/v1/", include("paper.urls")),
    path("api/v1/", include("questions.urls")),
    path("api/v1/", include("files.urls")),
    path("api/v1/", include("telegram_bot.urls")),
    path("api/v1/", include("ads.urls")),
    path("api/v1/", include("payments.urls")),
    path("api/v1/", include("games.urls")),
    path("api/v1/", include("insights.urls")),
    path("api/v1/", include("kelajak.urls")),
    path("api/v1/", include("ai_services.urls")),
    path("api/v1/", include("materials.urls")),
    path("api/v1/", include("psych.urls")),
    path("api/v1/", include("curriculum.urls")),
    path("api/v1/", include("notifications.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
