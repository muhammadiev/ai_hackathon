import hashlib
import hmac
import secrets
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import timedelta

from games.models import GameSession
from games import config as game_config
from accounts.scoping import active_school_ids, student_class_enrollment
from assignments.models import Assignment
from submissions.models import Submission
from audit.models import AuditLog


def _token() -> str:
    return secrets.token_urlsafe(32)


def _strip_keys(snapshot: list) -> list:
    out = []
    for q in snapshot or []:
        out.append(
            {
                "id": q.get("id") or q.get("question_id"),
                "version": q.get("version"),
                "text": q.get("text"),
                "html": q.get("html"),
                "options": q.get("options") or [],
                "qtype": q.get("qtype") or q.get("type") or "single",
                "points": q.get("points", 1),
            }
        )
    return out


def require_enabled():
    st = game_config.status_payload()
    if not st["enabled"]:
        raise ValidationError(st["message_uz"] or st["message"])


@transaction.atomic
def create_session(*, user, intent: str, assignment_id=None, locale="uz") -> GameSession:
    require_enabled()
    school_id = None
    sids = active_school_ids(user)
    if sids:
        school_id = sids[0]

    assignment = None
    payload = {
        "schemaVersion": "1.0",
        "origin": "mirae-maktab",
        "locale": locale,
        "issuedAt": timezone.now().isoformat(),
    }

    if intent == GameSession.Intent.TEACHER_CREATE:
        if user.global_role not in ("teacher", "admin", "superadmin"):
            raise ValidationError("Faqat o‘qituvchi.")
        payload.update(
            {
                "intent": "create_game",
                "role": "creator",
                "gametype": "create",
                "actor": {
                    "id": user.id,
                    "role": user.global_role,
                    "username": user.username,
                    "name": getattr(getattr(user, "profile", None), "full_name", "")
                    or user.username,
                },
            }
        )
    elif intent == GameSession.Intent.STUDENT_SIMPLE:
        if user.global_role != "student":
            raise ValidationError("Faqat o‘quvchi.")
        en = student_class_enrollment(user)
        payload.update(
            {
                "intent": "play",
                "gametype": "simple",
                "role": "student",
                "student": {
                    "studentId": user.id,
                    "username": user.username,
                    "fullName": getattr(getattr(user, "profile", None), "full_name", "")
                    or user.username,
                    "className": en.class_group.name if en else "",
                    "grade": en.class_group.grade if en else None,
                },
            }
        )
    elif intent == GameSession.Intent.STUDENT_HOMEWORK:
        if user.global_role != "student":
            raise ValidationError("Faqat o‘quvchi.")
        if not assignment_id:
            raise ValidationError("assignment_id kerak.")
        assignment = Assignment.objects.get(pk=assignment_id)
        if assignment.status != Assignment.Status.PUBLISHED:
            raise ValidationError("Vazifa e’lon qilinmagan.")
        en = student_class_enrollment(user)
        if not en or not assignment.targets.filter(
            class_group_id=en.class_group_id
        ).exists():
            raise ValidationError("Bu vazifa sizning sinfingizga tegishli emas.")
        # Do NOT send answer keys to the portal via student channel
        payload.update(
            {
                "intent": "play",
                "gametype": "homework",
                "role": "student",
                "student": {
                    "studentId": user.id,
                    "username": user.username,
                    "fullName": getattr(getattr(user, "profile", None), "full_name", "")
                    or user.username,
                    "className": en.class_group.name if en else "",
                    "grade": en.class_group.grade if en else None,
                },
                "homework": {
                    "id": assignment.id,
                    "title": assignment.title,
                    "kind": assignment.kind,
                    "subjectId": assignment.subject_id,
                    "deadline": assignment.deadline.isoformat()
                    if assignment.deadline
                    else None,
                },
                "questions": _strip_keys(assignment.question_snapshot),
            }
        )
    else:
        raise ValidationError("Noto‘g‘ri intent.")

    session = GameSession.objects.create(
        token=_token(),
        intent=intent,
        user=user,
        school_id=school_id,
        assignment=assignment,
        payload=payload,
        expires_at=timezone.now() + timedelta(minutes=30),
    )
    payload["sessionToken"] = session.token
    payload["requestId"] = session.token
    session.payload = payload
    session.save(update_fields=["payload"])
    return session


def get_valid_session(token: str) -> GameSession:
    session = GameSession.objects.select_related("user", "assignment").filter(
        token=token
    ).first()
    if not session:
        raise ValidationError("Sessiya topilmadi.")
    if session.expires_at < timezone.now():
        if session.status == GameSession.Status.ISSUED:
            session.status = GameSession.Status.EXPIRED
            session.save(update_fields=["status"])
        raise ValidationError("Sessiya muddati tugagan.")
    return session


def sign_callback_body(body: bytes, secret: str) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


@transaction.atomic
def apply_callback(*, token: str, result: dict, raw_ok: bool = True) -> Submission | None:
    """
    Portal server calls us with session token + result.
    Writes Submission source=game when homework score is present.
    """
    session = (
        GameSession.objects.select_for_update()
        .select_related("assignment", "user")
        .filter(token=token)
        .first()
    )
    if not session:
        raise ValidationError("Sessiya topilmadi.")
    if session.status == GameSession.Status.COMPLETED and session.submission_id:
        return session.submission  # idempotent
    if session.expires_at < timezone.now() + timedelta(hours=24):
        pass  # allow late callback within grace; still record
    session.result_payload = result or {}
    session.status = GameSession.Status.COMPLETED
    session.completed_at = timezone.now()

    sub = None
    if session.intent == GameSession.Intent.STUDENT_HOMEWORK and session.assignment_id:
        assignment = session.assignment
        # Prevent overwrite of existing published result
        existing = Submission.objects.filter(
            student_id=session.user_id,
            assignment_id=assignment.id,
            status=Submission.Status.PUBLISHED,
        ).first()
        if existing:
            session.submission = existing
            session.save()
            raise ValidationError(
                "Bu o‘quvchi uchun natija allaqachon e’lon qilingan (409)."
            )

        score = result.get("score")
        max_score = result.get("max_score") or result.get("total")
        if score is None and result.get("correct") is not None and result.get("total"):
            # derive from correct/total
            try:
                score = Decimal(str(result["correct"]))
                max_score = Decimal(str(result["total"]))
            except Exception:
                score = None
        if score is None:
            session.save()
            return None  # completed session, no grade

        score = Decimal(str(score))
        max_score = Decimal(str(max_score or assignment.max_score or 100))
        attempt_no = (
            Submission.objects.filter(
                student_id=session.user_id, assignment_id=assignment.id
            ).count()
            + 1
        )
        sub = Submission.objects.create(
            student_id=session.user_id,
            assignment=assignment,
            attempt_no=attempt_no,
            source=Submission.Source.GAME,
            status=Submission.Status.PUBLISHED,
            score=score,
            max_score=max_score,
            submitted_at=timezone.now(),
            graded_at=timezone.now(),
            meta={
                "game_session": session.token,
                "pct": result.get("pct"),
                "xpEarned": result.get("xpEarned"),
                "passed": result.get("passed"),
            },
        )
        session.submission = sub
        AuditLog.objects.create(
            actor=session.user,
            school=session.school,
            action="game.callback",
            object_type="Submission",
            object_id=str(sub.id),
            message=f"Game result {score}/{max_score}",
        )
    session.save()
    
    try:
        from insights.services import (
            maybe_create_understanding_check,
            update_topic_mastery_from_submission,
        )
        maybe_create_understanding_check(sub)
        update_topic_mastery_from_submission(sub)
    except Exception:
        pass
    return sub
