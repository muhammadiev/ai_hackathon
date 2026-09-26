from django.urls import path
from . import views

urlpatterns = [
    path("files/", views.FileUploadView.as_view()),
    path("files/<int:pk>/", views.FileDetailView.as_view()),
]
