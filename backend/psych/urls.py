from django.urls import path
from . import views

urlpatterns = [
    path("psych/questionnaires/", views.QuestionnaireListCreateView.as_view()),
    path("psych/questionnaires/<int:pk>/publish/", views.QuestionnairePublishView.as_view()),
    path("psych/responses/", views.PsychResponseListView.as_view()),
]
