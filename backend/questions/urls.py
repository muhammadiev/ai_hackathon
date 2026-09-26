from django.urls import path
from . import views

urlpatterns = [
    path("questions/", views.QuestionListCreateView.as_view()),
    path("questions/<int:pk>/", views.QuestionDetailView.as_view()),
    path("questions/<int:pk>/publish/", views.QuestionPublishView.as_view()),
    path("questions/<int:pk>/archive/", views.QuestionArchiveView.as_view()),
    path("questions/<int:pk>/restore/", views.QuestionRestoreView.as_view()),
]
