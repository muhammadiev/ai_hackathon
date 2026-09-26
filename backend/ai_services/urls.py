from django.urls import path
from . import views

urlpatterns = [
    path("ai/generation-jobs/", views.AIGenerationJobView.as_view()),
    path("ai/generation-jobs/<str:job_id>/", views.AIJobStatusView.as_view()),
    path("providers/status/", views.ProvidersStatusView.as_view()),
]
