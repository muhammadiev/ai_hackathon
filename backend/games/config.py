"""Game portal env configuration."""
import os
from urllib.parse import urlparse
from django.conf import settings


def portal_url() -> str:
    return (
        os.environ.get("GAME_PORTAL_URL")
        or getattr(settings, "GAME_PORTAL_URL", "")
        or ""
    ).strip()


def callback_secret() -> str:
    return (
        os.environ.get("GAME_PORTAL_CALLBACK_SECRET")
        or getattr(settings, "GAME_PORTAL_CALLBACK_SECRET", "")
        or ""
    ).strip()


def is_enabled() -> bool:
    """Enabled only when a non-empty, non-placeholder portal URL is configured."""
    url = portal_url()
    if not url:
        return False
    low = url.lower()
    if "example.com" in low or "game.mirae.uz" in low:
        # Treat known placeholders as disabled unless FORCE is set
        if os.environ.get("GAME_PORTAL_FORCE", "") != "1":
            return False
    return True


def valid_portal_url(url: str) -> bool:
    try:
        u = urlparse(url)
        if u.username or u.password:
            return False
        if u.scheme == "https":
            return bool(u.netloc)
        if u.scheme == "http":
            host = (u.hostname or "").lower()
            return host in ("localhost", "127.0.0.1") or host.endswith(".local")
        return False
    except Exception:
        return False


def status_payload() -> dict:
    url = portal_url()
    enabled = is_enabled() and valid_portal_url(url)
    if not url:
        msg = "Game portal is not working — GAME_PORTAL_URL is not configured."
        msg_uz = "O‘yin portali ishlamayapti — manzil sozlanmagan."
    elif not valid_portal_url(url):
        msg = "Game portal is not working — portal URL is invalid."
        msg_uz = "O‘yin portali ishlamayapti — manzil noto‘g‘ri."
        enabled = False
    elif not enabled:
        msg = "Game portal is not working — placeholder URL; set a real GAME_PORTAL_URL."
        msg_uz = "O‘yin portali ishlamayapti — haqiqiy manzilni kiriting."
    else:
        msg = "Game portal is configured."
        msg_uz = "O‘yin portali ulangan."
    return {
        "enabled": enabled,
        "portal_url": url if enabled else "",
        "message": msg,
        "message_uz": msg_uz,
        "supports_local": True,
        "hint": "Set GAME_PORTAL_URL=http://127.0.0.1:9000/launch for a local Django portal.",
    }
