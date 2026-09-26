from django.urls import path
from . import views

urlpatterns = [
    path("understanding/pending/", views.MyUnderstandingPendingView.as_view()),
    path("understanding/<int:pk>/answer/", views.UnderstandingAnswerView.as_view()),
    path("understanding/flags/", views.TeacherUnderstandingFlagsView.as_view()),
    path("mastery/me/", views.MyMasteryView.as_view()),
    path("mastery/class/<int:class_id>/", views.ClassMasteryView.as_view()),
    path("effectiveness/baselines/", views.BaselineCreateView.as_view()),
    path("effectiveness/before-after/", views.EffectivenessBeforeAfterView.as_view()),
    path("effectiveness/ab/", views.EffectivenessABView.as_view()),
    path("effectiveness/reports/", views.EffectivenessListView.as_view()),
    path("parents/links/", views.ParentLinkCreateView.as_view()),
    path("parents/tips/generate/", views.ParentTipGenerateView.as_view()),
    path("parents/tips/", views.ParentTipListView.as_view()),
    path("offline/sync/", views.OfflineSyncView.as_view()),
    path("creator/me/", views.CreatorMeView.as_view()),
]
