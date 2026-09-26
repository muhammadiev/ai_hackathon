"""
Twin recompute + pack proposal/purchase (demo wallet).
Ethics: ranges only, no guaranteed outcomes, no pack if improvement negligible.
"""
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

from kelajak.models import (
    StudentTwin,
    TwinSnapshot,
    AccelerationPack,
    ParentPurchase,
    TeacherRevenueShareRule,
    RevenueShareEvent,
)
from insights.models import TopicMastery, ParentLink
from schools.models import TeacherAssignment, ClassEnrollment
from payments import services as pay_services
from payments.models import LedgerEntry
from audit.models import AuditLog
from notifications.models import Notification

User = get_user_model()


def _q2(x) -> Decimal:
    return Decimal(str(x)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _school_for_student(student):
    mem = student.memberships.filter(is_active=True).select_related("school").first()
    return mem.school if mem else None


def student_class_group(student):
    en = (
        ClassEnrollment.objects.filter(student=student, is_active=True)
        .select_related("class_group")
        .first()
    )
    return en.class_group if en else None


def assert_can_view_student_twin(actor, student) -> None:
    """
    Allowed:
      - the student themselves
      - active ParentLink for that student where actor matches parent identity
        (phone match on actor.phone, or actor created/owns the link via meta)
      - teacher assigned to student's class
      - admin/superadmin of same school
    """
    if actor.id == student.id:
        return
    if actor.global_role == "superadmin":
        return

    school = _school_for_student(student)
    if actor.global_role == "admin" and school:
        from accounts.scoping import active_school_ids

        if school.id in active_school_ids(actor):
            return

    # Parent: active link + phone match (demo parent auth)
    links = ParentLink.objects.filter(student=student, is_active=True)
    if links.exists():
        actor_phone = (getattr(actor, "phone", None) or "").strip()
        digits = "".join(ch for ch in actor_phone if ch.isdigit())
        for link in links:
            lp = (link.parent_phone or "").strip()
            ld = "".join(ch for ch in lp if ch.isdigit())
            if digits and ld and digits[-9:] == ld[-9:]:
                return
            # teacher/admin managing parent tips is not automatic twin access for packs

    # Teacher of student's class
    cg = student_class_group(student)
    if cg and actor.global_role == "teacher":
        if TeacherAssignment.objects.filter(
            teacher=actor, class_group=cg, is_active=True
        ).exists():
            return

    raise ValidationError("Ruxsat yo‘q (twin/pack).")


def assert_can_manage_pack(actor, pack: AccelerationPack) -> None:
    """Complete/detail for teachers: must teach student's class (or admin)."""
    if actor.global_role == "superadmin":
        return
    student = pack.student
    if actor.id == student.id:
        return
    school = pack.school
    if actor.global_role == "admin":
        from accounts.scoping import active_school_ids

        if school_id_in(actor, school.id):
            return
    cg = student_class_group(student)
    if cg and actor.global_role == "teacher":
        if TeacherAssignment.objects.filter(
            teacher=actor, class_group=cg, is_active=True
        ).exists():
            return
    raise ValidationError("Ruxsat yo‘q (pack).")


def school_id_in(actor, school_id: int) -> bool:
    from accounts.scoping import active_school_ids

    return school_id in active_school_ids(actor)


@transaction.atomic
def recompute_twin(*, student, trigger: str = TwinSnapshot.Trigger.MANUAL) -> StudentTwin:
    school = _school_for_student(student)
    if not school:
        raise ValidationError("O‘quvchi maktabga bog‘lanmagan.")

    mastery = list(TopicMastery.objects.filter(student=student))
    if mastery:
        avg_p = sum(float(m.p_know) for m in mastery) / len(mastery)
    else:
        avg_p = 0.35

    mid_score = 40 + 50 * avg_p
    spread_s = 6 + (1 - avg_p) * 8
    score_low = _q2(max(0, mid_score - spread_s))
    score_high = _q2(min(100, mid_score + spread_s))

    mid_p = max(5.0, min(55.0, (mid_score - 50) * 1.2 + 15))
    spread_p = 5 + (1 - avg_p) * 6
    p_low = _q2(max(1, mid_p - spread_p))
    p_high = _q2(min(70, mid_p + spread_p))

    if mastery:
        best = max(mastery, key=lambda m: float(m.p_know))
        direction = best.topic_label or best.topic_key or "Umumiy"
    else:
        direction = "Aniqlanmoqda"

    twin, _ = StudentTwin.objects.select_for_update().get_or_create(
        student=student,
        defaults={"school": school},
    )
    twin.school = school
    twin.score_low = score_low
    twin.score_high = score_high
    twin.probability_low = p_low
    twin.probability_high = p_high
    twin.top_direction = direction[:120]
    twin.last_recomputed_at = timezone.now()
    twin.save()

    TwinSnapshot.objects.create(
        twin=twin,
        score_low=score_low,
        score_high=score_high,
        probability_low=p_low,
        probability_high=p_high,
        direction=direction[:120],
        trigger=trigger,
        meta={"mastery_count": len(mastery), "avg_p_know": round(avg_p, 4)},
    )
    return twin


def get_or_create_twin_readonly(student) -> StudentTwin:
    """Read path: return existing twin without appending snapshot. Bootstrap once if missing."""
    twin = StudentTwin.objects.filter(student=student).first()
    if twin:
        return twin
    return recompute_twin(student=student, trigger=TwinSnapshot.Trigger.INITIAL)


def propose_pack(*, student, force: bool = False) -> AccelerationPack | None:
    """
    Free proposal. Returns None if no real mastery data or improvement negligible.
    Does NOT recompute twin (caller controls that).
    """
    twin = StudentTwin.objects.filter(student=student).first()
    if twin is None:
        twin = get_or_create_twin_readonly(student)

    weak = list(TopicMastery.objects.filter(student=student).order_by("p_know")[:3])
    # Ethic: no synthetic weak topics for brand-new students — nothing to sell
    if not weak:
        return None

    topics = [
        {
            "key": m.topic_key,
            "label": m.topic_label or m.topic_key,
            "p_know": float(m.p_know),
            "subject_id": m.subject_id,
        }
        for m in weak
    ]

    avg_weak = sum(t["p_know"] for t in topics) / len(topics)
    if avg_weak >= 0.75:
        return None

    snap = twin.snapshots.order_by("-computed_at").first()
    lift = _q2(min(12, (0.75 - avg_weak) * 20))
    after_low = _q2(min(65, twin.probability_low + lift * Decimal("0.5")))
    after_high = _q2(min(75, twin.probability_high + lift))
    if after_high - twin.probability_high < Decimal("2"):
        return None

    existing = AccelerationPack.objects.filter(
        student=student, status=AccelerationPack.Status.PROPOSED
    ).first()
    if existing and not force:
        return existing

    weeks = 4
    price = _q2(99000 + len(topics) * 15000)

    return AccelerationPack.objects.create(
        student=student,
        school=twin.school,
        generated_from_snapshot=snap,
        target_topics=topics,
        duration_weeks=weeks,
        price=price,
        probability_before_low=twin.probability_low,
        probability_before_high=twin.probability_high,
        probability_after_low=after_low,
        probability_after_high=after_high,
    )


@transaction.atomic
def purchase_pack(
    *,
    pack: AccelerationPack,
    payer_type: str,
    payer_user,
    parent_link: ParentLink | None = None,
) -> AccelerationPack:
    pack = AccelerationPack.objects.select_for_update().get(pk=pack.pk)
    if pack.status != AccelerationPack.Status.PROPOSED:
        raise ValidationError("Bu paket allaqachon xarid qilingan yoki yopilgan.")

    if payer_type == "parent":
        if not parent_link or parent_link.student_id != pack.student_id:
            raise ValidationError("Ota-ona bog‘lanishi noto‘g‘ri.")
        # Parent must be verified: phone match
        actor_phone = (getattr(payer_user, "phone", None) or "").strip()
        digits = "".join(ch for ch in actor_phone if ch.isdigit())
        ld = "".join(ch for ch in (parent_link.parent_phone or "") if ch.isdigit())
        if not digits or not ld or digits[-9:] != ld[-9:]:
            raise ValidationError(
                "Ota-ona tasdiqlanmadi (telefon mos emas). Demo: parent user phone = link phone."
            )
    else:
        if payer_user.id != pack.student_id:
            raise ValidationError("Faqat o‘quvchi o‘z paketini xarid qila oladi.")

    entry = pay_services.debit(
        user=payer_user,
        amount=pack.price,
        title=f"Acceleration Pack #{pack.id}",
        reference=f"pack:{pack.id}",
        meta={"demo": True, "pack_id": pack.id, "payer_type": payer_type},
        actor=payer_user,
    )

    pack.status = AccelerationPack.Status.ACTIVE
    pack.purchased_by_type = payer_type
    pack.purchased_by = payer_user
    pack.parent_link = parent_link
    pack.ledger_entry = entry
    pack.purchased_at = timezone.now()
    pack.save()

    if parent_link:
        ParentPurchase.objects.create(
            parent_link=parent_link,
            pack=pack,
            amount=pack.price,
            status="completed",
            ledger_entry=entry,
        )

    _credit_teacher_share(pack)

    Notification.objects.create(
        user_id=pack.student_id,
        title="Acceleration Pack faollashtirildi",
        body=(
            f"{pack.duration_weeks} haftalik reja. "
            f"Ehtimol: {pack.probability_before_low}–{pack.probability_before_high}%. "
            f"Natija kafolatlanmaydi."
        ),
        link="/kelajak",
    )
    AuditLog.objects.create(
        actor=payer_user,
        school=pack.school,
        action="kelajak.pack_purchased",
        object_type="AccelerationPack",
        object_id=str(pack.id),
        message=f"Pack purchased demo {pack.price} by {payer_type}",
    )
    return pack


def _credit_teacher_share(pack: AccelerationPack):
    """
    Split price × percentage across teachers of target-topic subjects
    for the student's class (proportional to topic count per subject).
    """
    rule, _ = TeacherRevenueShareRule.objects.get_or_create(
        category="acceleration_pack",
        defaults={"percentage": Decimal("20")},
    )
    if not rule.is_active:
        return
    total_share = _q2(pack.price * rule.percentage / Decimal("100"))
    if total_share <= 0:
        return

    cg = student_class_group(pack.student)
    if not cg:
        return

    # Count topics per subject_id from pack.target_topics
    subject_weights: dict[int, int] = {}
    for t in pack.target_topics or []:
        sid = t.get("subject_id")
        if sid:
            subject_weights[int(sid)] = subject_weights.get(int(sid), 0) + 1

    # Map subject → teachers assigned to class+subject
    teacher_weight: dict[int, float] = {}
    if subject_weights:
        for subject_id, w in subject_weights.items():
            tas = TeacherAssignment.objects.filter(
                class_group=cg, subject_id=subject_id, is_active=True
            )
            n = tas.count() or 1
            for ta in tas:
                teacher_weight[ta.teacher_id] = teacher_weight.get(ta.teacher_id, 0) + (
                    w / n
                )
    else:
        # Fallback: all class teachers equal split
        tas = TeacherAssignment.objects.filter(class_group=cg, is_active=True)
        for ta in tas:
            teacher_weight[ta.teacher_id] = teacher_weight.get(ta.teacher_id, 0) + 1

    if not teacher_weight:
        return

    weight_sum = sum(teacher_weight.values())
    for teacher_id, w in teacher_weight.items():
        per = _q2(total_share * Decimal(str(w / weight_sum)))
        if per <= 0:
            continue
        try:
            teacher = User.objects.get(pk=teacher_id)
            le = pay_services.credit(
                user=teacher,
                amount=per,
                kind=LedgerEntry.Kind.ADJUST,
                title=f"Revenue share: Pack #{pack.id}",
                reference=f"revshare:pack:{pack.id}",
                meta={
                    "demo": True,
                    "pack_id": pack.id,
                    "student_id": pack.student_id,
                    "weight": w,
                },
                actor=teacher,
            )
        except Exception:
            continue
        RevenueShareEvent.objects.create(
            pack=pack, teacher_id=teacher_id, amount=per, ledger_entry=le
        )
        Notification.objects.create(
            user_id=teacher_id,
            title="Acceleration Pack ulushi",
            body=f"Pack #{pack.id} dan {per} so‘m (demo) ulush.",
            link="/creator",
        )


@transaction.atomic
def complete_pack(*, pack: AccelerationPack) -> AccelerationPack:
    pack = AccelerationPack.objects.select_for_update().get(pk=pack.pk)
    if pack.status not in (
        AccelerationPack.Status.ACTIVE,
        AccelerationPack.Status.PURCHASED,
    ):
        raise ValidationError("Paket faol emas.")
    pack.status = AccelerationPack.Status.COMPLETED
    pack.completed_at = timezone.now()
    pack.save()
    recompute_twin(student=pack.student, trigger=TwinSnapshot.Trigger.POST_PACK)
    return pack
