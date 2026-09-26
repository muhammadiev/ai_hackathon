from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
from curriculum.models import Video, VideoEntitlement
from payments import services as pay_services
from payments.models import LedgerEntry


def can_watch(user, video: Video) -> bool:
    if video.is_free:
        return True
    if user.global_role in ("teacher", "admin", "superadmin"):
        return True
    return VideoEntitlement.objects.filter(video=video, user=user).exists()


@transaction.atomic
def purchase_video(*, user, video: Video):
    if video.is_free:
        raise ValidationError("Bu video bepul.")
    if VideoEntitlement.objects.filter(video=video, user=user).exists():
        raise ValidationError("Allaqachon sotib olingan.")
    if video.price <= 0:
        raise ValidationError("Narx noto‘g‘ri.")
    entry = pay_services.debit(
        user=user,
        amount=video.price,
        title=f"Video: {video.title}",
        reference=f"video:{video.id}",
        meta={"demo": True, "video_id": video.id},
        actor=user,
    )
    VideoEntitlement.objects.create(video=video, user=user, source="purchase")
    return entry
