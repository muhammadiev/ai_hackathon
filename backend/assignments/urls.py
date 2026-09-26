from django.urls import path
from . import views

urlpatterns = [
    path("assignments/", views.AssignmentListCreateView.as_view()),
    path("assignments/<int:pk>/", views.AssignmentDetailView.as_view()),
    path("assignments/<int:pk>/publish/", views.AssignmentPublishView.as_view()),
]
