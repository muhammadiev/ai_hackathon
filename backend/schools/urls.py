from django.urls import path
from . import views

urlpatterns = [
    path("classes/", views.MyClassesView.as_view()),
    path("classes/<int:class_id>/students/", views.ClassStudentsView.as_view()),
    path("subjects/", views.SubjectListView.as_view()),
    path("teacher-assignments/", views.MyTeacherAssignmentsView.as_view()),
]
