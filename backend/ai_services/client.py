"""LLM client: live if AI_PROVIDER + key set, else deterministic stub."""
from __future__ import annotations

import json
import urllib.request
from typing import Any

from config.providers import ai_config


def generate_questions(*, subject: str = "", prompt: str = "", n: int = 3) -> dict[str, Any]:
    cfg = ai_config()
    if not cfg.enabled:
        return {
            "provider": "stub",
            "mode": "stub",
            "draft_questions": [
                {
                    "text": f"Demo savol {i+1}" + (f" ({subject})" if subject else ""),
                    "options": ["A", "B", "C", "D"],
                    "correct": 0,
                    "note": "AI_PROVIDER o‘rnatilmagan — stub",
                }
                for i in range(max(1, min(n, 5)))
            ],
        }

    # Minimal OpenAI-compatible chat completions (works for openai, xai, groq, many custom)
    if cfg.provider in ("openai", "xai", "groq", "custom"):
        return _openai_compatible(cfg, subject=subject, prompt=prompt, n=n)
    if cfg.provider == "anthropic":
        return _anthropic(cfg, subject=subject, prompt=prompt, n=n)
    return generate_questions.__wrapped__(subject=subject, prompt=prompt, n=n) if False else {
        "provider": cfg.provider,
        "mode": "stub",
        "draft_questions": [],
        "error": "Unknown provider",
    }


def _openai_compatible(cfg, *, subject, prompt, n) -> dict[str, Any]:
    system = (
        "You generate school multiple-choice questions as JSON array. "
        "Each item: {text, options: [4 strings], correct: index 0-3}. "
        f"Return exactly {n} items. No markdown."
    )
    user = prompt or f"Subject: {subject or 'general'}. Grade 7-9."
    body = {
        "model": cfg.model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.4,
    }
    url = cfg.api_base.rstrip("/") + "/chat/completions"
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {cfg.api_key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode())
        content = data["choices"][0]["message"]["content"]
        drafts = _parse_json_array(content)
        return {"provider": cfg.provider, "mode": "live", "draft_questions": drafts}
    except Exception as e:
        return {
            "provider": cfg.provider,
            "mode": "error_fallback_stub",
            "error": str(e)[:200],
            "draft_questions": [
                {
                    "text": "AI xato — stub savol",
                    "options": ["A", "B", "C", "D"],
                    "correct": 0,
                }
            ],
        }


def _anthropic(cfg, *, subject, prompt, n) -> dict[str, Any]:
    user = prompt or f"Subject: {subject}. Generate {n} MCQ as JSON array with text, options, correct."
    body = {
        "model": cfg.model,
        "max_tokens": 2048,
        "messages": [{"role": "user", "content": user}],
    }
    url = (cfg.api_base or "https://api.anthropic.com").rstrip("/") + "/v1/messages"
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "x-api-key": cfg.api_key,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode())
        content = data["content"][0]["text"]
        drafts = _parse_json_array(content)
        return {"provider": "anthropic", "mode": "live", "draft_questions": drafts}
    except Exception as e:
        return {
            "provider": "anthropic",
            "mode": "error_fallback_stub",
            "error": str(e)[:200],
            "draft_questions": [],
        }


def _parse_json_array(text: str) -> list:
    text = text.strip()
    if "```" in text:
        parts = text.split("```")
        text = parts[1] if len(parts) > 1 else text
        if text.startswith("json"):
            text = text[4:]
    try:
        data = json.loads(text)
        if isinstance(data, list):
            return data[:10]
        if isinstance(data, dict) and "questions" in data:
            return data["questions"][:10]
    except Exception:
        pass
    return [{"text": text[:300], "options": ["A", "B", "C", "D"], "correct": 0}]
