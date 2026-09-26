"""
External providers — all driven by environment.
Empty / missing → safe defaults (stubs, demo, local).
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Any


def _env(key: str, default: str = "") -> str:
    return (os.environ.get(key) or default).strip()


@dataclass(frozen=True)
class AIConfig:
    provider: str  # none | openai | anthropic | xai | groq | custom
    api_key: str
    api_base: str
    model: str
    enabled: bool

    def status(self) -> dict[str, Any]:
        return {
            "provider": self.provider,
            "enabled": self.enabled,
            "model": self.model if self.enabled else "",
            "mode": "live" if self.enabled else "stub",
        }


@dataclass(frozen=True)
class PaymentConfig:
    provider: str  # none | click | payme
    enabled: bool
    click_merchant_id: str
    click_service_id: str
    click_secret: str
    payme_merchant_id: str
    payme_secret: str

    def status(self) -> dict[str, Any]:
        return {
            "provider": self.provider,
            "enabled": self.enabled,
            "mode": "live" if self.enabled else "demo_wallet",
        }


@dataclass(frozen=True)
class TelegramConfig:
    bot_token: str
    webhook_secret: str
    enabled: bool

    def status(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "webhook_secret_set": bool(self.webhook_secret),
            "bot_token_set": bool(self.bot_token),
        }


@dataclass(frozen=True)
class GamePortalConfig:
    url: str
    callback_secret: str
    enabled: bool

    def status(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "url": self.url if self.enabled else "",
            "callback_secret_set": bool(self.callback_secret),
        }


@dataclass(frozen=True)
class OMRConfig:
    provider: str
    api_url: str
    api_key: str
    enabled: bool

    def status(self) -> dict[str, Any]:
        return {
            "provider": self.provider,
            "enabled": self.enabled,
            "mode": "live" if self.enabled else "manual_confirm",
        }


@lru_cache(maxsize=1)
def ai_config() -> AIConfig:
    provider = (_env("AI_PROVIDER", "none") or "none").lower()
    key = (
        _env("AI_API_KEY")
        or _env("OPENAI_API_KEY")
        or _env("ANTHROPIC_API_KEY")
        or _env("XAI_API_KEY")
        or _env("GROQ_API_KEY")
    )
    base = _env("AI_API_BASE")
    model = _env("AI_MODEL")

    defaults = {
        "openai": ("https://api.openai.com/v1", "gpt-4o-mini"),
        "anthropic": ("https://api.anthropic.com", "claude-3-5-sonnet-latest"),
        "xai": ("https://api.x.ai/v1", "grok-2-latest"),
        "groq": ("https://api.groq.com/openai/v1", "llama-3.3-70b-versatile"),
        "custom": (base or "", model or "default"),
        "none": ("", ""),
    }
    d_base, d_model = defaults.get(provider, ("", ""))
    if not base:
        base = d_base
    if not model:
        model = d_model

    enabled = provider != "none" and bool(key)
    return AIConfig(
        provider=provider if enabled else "none",
        api_key=key if enabled else "",
        api_base=base,
        model=model,
        enabled=enabled,
    )


@lru_cache(maxsize=1)
def payment_config() -> PaymentConfig:
    provider = (_env("PAYMENT_PROVIDER", "none") or "none").lower()
    click_m = _env("CLICK_MERCHANT_ID")
    click_s = _env("CLICK_SERVICE_ID")
    click_k = _env("CLICK_SECRET_KEY")
    payme_m = _env("PAYME_MERCHANT_ID")
    payme_k = _env("PAYME_SECRET_KEY")
    enabled = False
    if provider == "click" and click_m and click_k:
        enabled = True
    elif provider == "payme" and payme_m and payme_k:
        enabled = True
    else:
        provider = "none"
    return PaymentConfig(
        provider=provider,
        enabled=enabled,
        click_merchant_id=click_m,
        click_service_id=click_s,
        click_secret=click_k,
        payme_merchant_id=payme_m,
        payme_secret=payme_k,
    )


@lru_cache(maxsize=1)
def telegram_config() -> TelegramConfig:
    token = _env("TELEGRAM_BOT_TOKEN")
    secret = _env("TELEGRAM_WEBHOOK_SECRET")
    return TelegramConfig(
        bot_token=token,
        webhook_secret=secret,
        enabled=bool(token),
    )


@lru_cache(maxsize=1)
def game_portal_config() -> GamePortalConfig:
    url = _env("GAME_PORTAL_URL")
    secret = _env("GAME_PORTAL_CALLBACK_SECRET")
    force = _env("GAME_PORTAL_FORCE") == "1"
    low = url.lower()
    placeholder = (not url) or ("example.com" in low) or (
        "game.mirae.uz" in low and not force
    )
    enabled = bool(url) and not placeholder
    return GamePortalConfig(url=url if enabled else "", callback_secret=secret, enabled=enabled)


@lru_cache(maxsize=1)
def omr_config() -> OMRConfig:
    provider = (_env("OMR_PROVIDER", "none") or "none").lower()
    url = _env("OMR_API_URL")
    key = _env("OMR_API_KEY")
    enabled = provider != "none" and bool(url)
    return OMRConfig(
        provider=provider if enabled else "none",
        api_url=url,
        api_key=key,
        enabled=enabled,
    )


def all_provider_status() -> dict[str, Any]:
    return {
        "ai": ai_config().status(),
        "payments": payment_config().status(),
        "telegram": telegram_config().status(),
        "game_portal": game_portal_config().status(),
        "omr": omr_config().status(),
    }
