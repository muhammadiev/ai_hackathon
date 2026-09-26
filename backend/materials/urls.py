from django.urls import path
from . import views

urlpatterns = [
    path("support/messages/", views.SupportMessageListCreateView.as_view()),
    path("school/contacts/", views.SchoolContactsView.as_view()),
]
