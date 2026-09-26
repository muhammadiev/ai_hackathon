from django.urls import path
from . import views

urlpatterns = [
    path("submissions/", views.SubmissionListView.as_view()),
    path("submissions/start/", views.DigitalStartView.as_view()),
    path("submissions/<int:pk>/finish/", views.DigitalFinishView.as_view()),
    path(
        "assignments/<int:assignment_id>/results/",
        views.AssignmentResultsView.as_view(),
    ),
]
