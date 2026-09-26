from django.urls import path
from . import views

urlpatterns = [
    path("paper/batches/", views.PaperBatchCreateView.as_view()),
    path("paper/batches/<int:pk>/", views.PaperBatchDetailView.as_view()),
    path("paper/batches/<int:pk>/print/", views.PaperBatchPrintView.as_view()),
    path("paper/scans/", views.ScanCreateView.as_view()),
    path("paper/scans/<int:pk>/", views.ScanDetailView.as_view()),
    path("paper/scans/<int:pk>/patch/", views.ScanPatchView.as_view()),
    path("paper/scans/<int:pk>/confirm/", views.ScanConfirmView.as_view()),
    path("paper/roster-codes/", views.RosterCodesView.as_view()),
]
