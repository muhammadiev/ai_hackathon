from django.urls import path
from . import views

urlpatterns = [
    path("game/status/", views.GameStatusView.as_view()),
    path("game/sessions/", views.GameSessionCreateView.as_view()),
    path("game/sessions/<str:token>/", views.GameSessionDetailView.as_view()),
    path("game/callback/", views.GameCallbackView.as_view()),
]
