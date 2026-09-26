from django.urls import path
from . import views

urlpatterns = [
    path("admin/ads/prompts/", views.AdPromptListCreateView.as_view()),
    path("admin/ads/prompts/<int:pk>/generate/", views.AdPromptGenerateView.as_view()),
    path("admin/ads/", views.AdCreativeListView.as_view()),
    path("admin/ads/<int:pk>/status/", views.AdCreativeStatusView.as_view()),
    path("ads/active/", views.ActiveAdsView.as_view()),
    path("ads/<int:pk>/impression/", views.AdImpressionView.as_view()),
]
