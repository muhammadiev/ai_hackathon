from django.urls import path
from . import views
from . import compat

urlpatterns = [
    path("accounts/me/", views.MeView.as_view()),
    path("accounts/me/password/", views.ChangePasswordView.as_view()),
    path("accounts/me/telegram/link/", views.TelegramLinkStartView.as_view()),
    path("auth/logout/", views.LogoutView.as_view()),
    # Student frontend aliases
    path("auth/login/", compat.CompatLoginView.as_view()),
    path("me/", compat.CompatMeView.as_view()),
    path("dashboard/", compat.CompatDashboardView.as_view()),
    path("classes/me/", compat.CompatClassesMeView.as_view()),
]
