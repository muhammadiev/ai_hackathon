from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Notification


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = request.user.notifications.all()[:50]
        return Response(
            {
                "count": len(qs),
                "unread": request.user.notifications.filter(is_read=False).count(),
                "results": [
                    {
                        "id": n.id,
                        "title": n.title,
                        "body": n.body,
                        "link": n.link,
                        "is_read": n.is_read,
                        "created_at": n.created_at,
                    }
                    for n in qs
                ],
            }
        )


class NotificationReadAllView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.notifications.filter(is_read=False).update(is_read=True)
        return Response({"ok": True})


class NotificationToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        n = get_object_or_404(Notification, pk=pk, user=request.user)
        n.is_read = not n.is_read
        n.save(update_fields=["is_read"])
        return Response({"ok": True, "id": n.id, "is_read": n.is_read})
