from django.urls import path
from . import views

urlpatterns = [
    path("telegram/webhook/", views.TelegramWebhookView.as_view()),
    path("telegram/inbox/", views.TelegramInboxView.as_view()),
    path("telegram/inbox/<int:pk>/", views.TelegramInboundDetailView.as_view()),
    path("telegram/inbox/<int:pk>/assign/", views.TelegramAssignView.as_view()),
    path("telegram/inbox/<int:pk>/ai-grade/", views.TelegramAIGradeView.as_view()),
    path("telegram/inbox/<int:pk>/confirm-grade/", views.TelegramConfirmView.as_view()),
    path("telegram/settings/", views.TelegramChannelSettingsView.as_view()),
]
