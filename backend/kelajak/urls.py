from django.urls import path
from . import views

urlpatterns = [
    path("kelajak/twin/", views.TwinMeView.as_view()),
    path("kelajak/twin/recompute/", views.TwinRecomputeView.as_view()),
    path("kelajak/acceleration-packs/proposed/", views.PackProposedView.as_view()),
    path("kelajak/acceleration-packs/history/", views.PackHistoryView.as_view()),
    path("kelajak/acceleration-packs/<int:pk>/", views.PackDetailView.as_view()),
    path("kelajak/acceleration-packs/<int:pk>/purchase/", views.PackPurchaseView.as_view()),
    path("kelajak/acceleration-packs/<int:pk>/complete/", views.PackCompleteView.as_view()),
    path("parents/children/<int:student_id>/twin/", views.ParentChildTwinView.as_view()),
    path(
        "parents/children/<int:student_id>/acceleration-packs/proposed/",
        views.ParentChildPacksView.as_view(),
    ),
    path("staff/twin-earnings/", views.TeacherTwinEarningsView.as_view()),
]
