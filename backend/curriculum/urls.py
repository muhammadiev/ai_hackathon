from django.urls import path
from . import views

urlpatterns = [
    path("courses/", views.CourseListCreateView.as_view()),
    path("courses/<int:pk>/", views.CourseDetailView.as_view()),
    path("videos/", views.VideoListCreateView.as_view()),
    path("videos/<int:pk>/purchase/", views.VideoPurchaseView.as_view()),
    path("exams/", views.ExamListCreateView.as_view()),
    path("exams/<int:pk>/", views.ExamDetailView.as_view()),
]
