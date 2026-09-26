"""
Mirae Maktab — Django settings.
Timezone: Asia/Tashkent. Auth: JWT. Admin: Unfold.
"""
import os

# Optional .env file (never commit secrets)
try:
    from pathlib import Path as _P
    _env_file = _P(__file__).resolve().parent.parent / ".env"
    if _env_file.exists():
        for _line in _env_file.read_text().splitlines():
            _line = _line.strip()
            if not _line or _line.startswith("#") or "=" not in _line:
                continue
            _k, _v = _line.split("=", 1)
            _k, _v = _k.strip(), _v.strip().strip('"').strip("'")
            if _k and _k not in os.environ:
                os.environ[_k] = _v
except Exception:
    pass

from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "dev-only-change-in-production-mirae-maktab-2026",
)
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "*").split(",")
    if h.strip()
]

INSTALLED_APPS = [
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "accounts",
    "schools",
    "files",
    "audit",
    "questions",
    "assignments",
    "submissions",
    "paper",
    "curriculum",
    "materials",
    "payments",
    "games",
    "notifications",
    "psych",
    "ads",
    "telegram_bot",
    "ai_services",
    "insights",
    "kelajak",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

if os.environ.get("DATABASE_URL"):
    # postgres://user:pass@host:5432/db — simple parse without extra deps
    import re
    m = re.match(
        r"postgres(?:ql)?://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)",
        os.environ["DATABASE_URL"],
    )
    if m:
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.postgresql",
                "USER": m.group(1),
                "PASSWORD": m.group(2),
                "HOST": m.group(3),
                "PORT": m.group(4),
                "NAME": m.group(5),
            }
        }
    else:
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": Path(os.environ.get("SQLITE_PATH", "/tmp/mirae_db.sqlite3")),
            }
        }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": Path(os.environ.get("SQLITE_PATH", "/tmp/mirae_db.sqlite3")),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "uz"
TIME_ZONE = "Asia/Tashkent"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "30/min",
        "user": "120/min",
        "login": "10/min",
    },
    "EXCEPTION_HANDLER": "config.exceptions.api_exception_handler",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=2),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "UPDATE_LAST_LOGIN": True,
}

CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True
if not DEBUG:
    CORS_ALLOWED_ORIGINS = [
        o.strip()
        for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
        if o.strip()
    ]

CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://127.0.0.1:6379/0")
CELERY_RESULT_BACKEND = os.environ.get(
    "CELERY_RESULT_BACKEND", "redis://127.0.0.1:6379/1"
)
CELERY_TASK_ALWAYS_EAGER = os.environ.get("CELERY_TASK_ALWAYS_EAGER", "1") == "1"

# Security headers when not DEBUG
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    X_FRAME_OPTIONS = "DENY"

UNFOLD = {
    "SITE_TITLE": "Mirae Maktab",
    "SITE_HEADER": "Mirae Super Admin",
    "SITE_SUBHEADER": "Platforma boshqaruvi",
    "SITE_SYMBOL": "school",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": False,
    "THEME": "dark",
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "Asosiy",
                "separator": True,
                "items": [
                    {
                        "title": "Boshqaruv paneli",
                        "icon": "dashboard",
                        "link": "/admin/",
                    },
                ],
            },
            {
                "title": "Foydalanuvchilar",
                "separator": True,
                "items": [
                    {
                        "title": "Hisoblar",
                        "icon": "person",
                        "link": "/admin/accounts/user/",
                    },
                    {
                        "title": "Profillar",
                        "icon": "badge",
                        "link": "/admin/accounts/profile/",
                    },
                    {
                        "title": "Maktab a’zoligi",
                        "icon": "group",
                        "link": "/admin/accounts/schoolmembership/",
                    },
                    {
                        "title": "Telegram bog‘lanish",
                        "icon": "send",
                        "link": "/admin/accounts/telegramlink/",
                    },
                ],
            },
            {
                "title": "Maktab",
                "separator": True,
                "items": [
                    {
                        "title": "Maktablar",
                        "icon": "apartment",
                        "link": "/admin/schools/school/",
                    },
                    {
                        "title": "O‘quv yili",
                        "icon": "calendar_month",
                        "link": "/admin/schools/academicyear/",
                    },
                    {
                        "title": "Sinflar",
                        "icon": "class",
                        "link": "/admin/schools/classgroup/",
                    },
                    {
                        "title": "Fanlar",
                        "icon": "menu_book",
                        "link": "/admin/schools/subject/",
                    },
                    {
                        "title": "O‘quvchilar (sinf)",
                        "icon": "school",
                        "link": "/admin/schools/classenrollment/",
                    },
                    {
                        "title": "O‘qituvchi biriktirish",
                        "icon": "assignment_ind",
                        "link": "/admin/schools/teacherassignment/",
                    },
                ],
            },
            {
                "title": "Kontent",
                "separator": True,
                "items": [
                    {
                        "title": "Savollar",
                        "icon": "quiz",
                        "link": "/admin/questions/question/",
                    },
                    {
                        "title": "Vazifalar",
                        "icon": "task",
                        "link": "/admin/assignments/assignment/",
                    },
                    {
                        "title": "Topshiriqlar",
                        "icon": "grading",
                        "link": "/admin/submissions/submission/",
                    },
                ],
            },
            {
                "title": "Qog‘oz / kanallar",
                "separator": True,
                "items": [
                    {
                        "title": "Chop to‘plamlari",
                        "icon": "print",
                        "link": "/admin/paper/paperbatch/",
                    },
                    {
                        "title": "Skanlar",
                        "icon": "document_scanner",
                        "link": "/admin/paper/scanjob/",
                    },
                    {
                        "title": "Telegram inbox",
                        "icon": "send",
                        "link": "/admin/telegram_bot/telegraminbound/",
                    },
                    {
                        "title": "Telegram sozlamalar",
                        "icon": "tune",
                        "link": "/admin/telegram_bot/telegramchannelsettings/",
                    },
                ],
            },
            {
                "title": "Reklama",
                "separator": True,
                "items": [
                    {
                        "title": "Promptlar",
                        "icon": "campaign",
                        "link": "/admin/ads/adprompt/",
                    },
                    {
                        "title": "Kreativlar",
                        "icon": "ads_click",
                        "link": "/admin/ads/adcreative/",
                    },
                    {
                        "title": "Ko‘rishlar",
                        "icon": "visibility",
                        "link": "/admin/ads/adimpression/",
                    },
                ],
            },
            {
                "title": "Kelajak / Twin",
                "separator": True,
                "items": [
                    {"title": "Student Twin", "icon": "hub", "link": "/admin/kelajak/studenttwin/"},
                    {"title": "Snapshots", "icon": "timeline", "link": "/admin/kelajak/twinsnapshot/"},
                    {"title": "Acceleration Packs", "icon": "rocket_launch", "link": "/admin/kelajak/accelerationpack/"},
                    {"title": "Revenue share", "icon": "payments", "link": "/admin/kelajak/revenueshareevent/"},
                ],
            },
            {
                "title": "Insights",
                "separator": True,
                "items": [
                    {"title": "Tushunish tasdig‘i", "icon": "psychology", "link": "/admin/insights/understandingcheck/"},
                    {"title": "Mavzu mastery", "icon": "school", "link": "/admin/insights/topicmastery/"},
                    {"title": "Samaradorlik", "icon": "analytics", "link": "/admin/insights/effectivenessreport/"},
                    {"title": "Ota-ona tip", "icon": "family_restroom", "link": "/admin/insights/parentweeklytip/"},
                    {"title": "Ijodkor balans", "icon": "emoji_events", "link": "/admin/insights/creatorbalance/"},
                ],
            },
            {
                "title": "O‘yin portal",
                "separator": True,
                "items": [
                    {
                        "title": "Sessions",
                        "icon": "sports_esports",
                        "link": "/admin/games/gamesession/",
                    },
                ],
            },
            {
                "title": "Balans (demo)",
                "separator": True,
                "items": [
                    {
                        "title": "Hamyonlar",
                        "icon": "account_balance_wallet",
                        "link": "/admin/payments/wallet/",
                    },
                    {
                        "title": "Tranzaksiyalar",
                        "icon": "receipt_long",
                        "link": "/admin/payments/ledgerentry/",
                    },
                    {
                        "title": "To‘ldirish kodlari",
                        "icon": "confirmation_number",
                        "link": "/admin/payments/topupcode/",
                    },
                ],
            },
            {
                "title": "Tizim",
                "separator": True,
                "items": [
                    {
                        "title": "Fayllar",
                        "icon": "folder",
                        "link": "/admin/files/storedfile/",
                    },
                    {
                        "title": "Audit",
                        "icon": "history",
                        "link": "/admin/audit/auditlog/",
                    },
                ],
            },
        ],
    },
    "COLORS": {
        "primary": {
            "50": "239 246 255",
            "100": "219 234 254",
            "200": "191 219 254",
            "300": "147 197 253",
            "400": "96 165 250",
            "500": "59 130 246",
            "600": "37 99 235",
            "700": "29 78 216",
            "800": "30 64 175",
            "900": "30 58 138",
            "950": "23 37 84",
        },
    },
}


# Telegram bot webhook secret (set in production)
# Empty default — webhook rejects when unset (except DEBUG with explicit allow)
TELEGRAM_WEBHOOK_SECRET = os.environ.get("TELEGRAM_WEBHOOK_SECRET", "")
TELEGRAM_WEBHOOK_ALLOW_INSECURE_DEBUG = os.environ.get(
    "TELEGRAM_WEBHOOK_ALLOW_INSECURE_DEBUG", ""
) == "1"


# Game portal (empty = disabled / "not working" for clients)
GAME_PORTAL_URL = os.environ.get("GAME_PORTAL_URL", "")
GAME_PORTAL_CALLBACK_SECRET = os.environ.get("GAME_PORTAL_CALLBACK_SECRET", "")
