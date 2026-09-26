"""
Shared MCQ / short-answer scoring (server authority).
Fixes empty-alias numeric bug (B09): empty strings never become 0.
"""
from decimal import Decimal
from typing import Any


LETTERS = "ABCDE"


def _finite_number(s: str):
    try:
        v = float(s)
        if v != v:  # NaN
            return None
        return v
    except (TypeError, ValueError):
        return None


def score_choice(correct_idx: int | None, marked: list, points: Decimal) -> tuple[bool, Decimal, int | None]:
    chosen = None
    if marked:
        ch = marked[0]
        if isinstance(ch, str) and ch.upper() in LETTERS:
            chosen = LETTERS.index(ch.upper())
        elif isinstance(ch, int):
            chosen = ch
    ok = chosen is not None and correct_idx is not None and chosen == correct_idx
    return ok, (points if ok else Decimal("0")), chosen


def score_short(accepted: list, answer: str, tolerance: float | None, points: Decimal) -> tuple[bool, Decimal]:
    """
    accepted: non-empty string aliases only.
    tolerance: only applied when both sides parse as finite numbers.
    """
    raw = (answer or "").strip()
    aliases = [a.strip() for a in (accepted or []) if isinstance(a, str) and a.strip() != ""]
    if not aliases:
        return False, Decimal("0")
    # exact text match (case-insensitive)
    low = raw.lower()
    for a in aliases:
        if a.lower() == low:
            return True, points
    if tolerance is not None:
        ans_n = _finite_number(raw)
        if ans_n is None:
            return False, Decimal("0")
        for a in aliases:
            alias_n = _finite_number(a)
            if alias_n is None:
                continue
            if abs(ans_n - alias_n) <= float(tolerance):
                return True, points
    return False, Decimal("0")


def score_mcq_snapshot(questions: list, marks: dict) -> tuple[Decimal, Decimal, list]:
    total = Decimal("0")
    max_total = Decimal("0")
    rows = []
    for i, q in enumerate(questions):
        pts = Decimal(str(q.get("points", 1)))
        max_total += pts
        marked = marks.get(i) or marks.get(str(i)) or []
        correct_idx = q.get("correct")
        if correct_idx is None and isinstance(q.get("answer_key"), dict):
            correct_idx = q["answer_key"].get("correct")
        ok, earned, chosen = score_choice(correct_idx, marked, pts)
        total += earned
        rows.append(
            {
                "question_index": i,
                "question_id": q.get("id") or q.get("question_id"),
                "question_version": q.get("version"),
                "response": {"choice": chosen, "letters": marked},
                "is_correct": ok,
                "points": earned,
                "max_points": pts,
            }
        )
    return total, max_total, rows
