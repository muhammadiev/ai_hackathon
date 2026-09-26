from django.urls import path
from . import views

urlpatterns = [
    path("wallet/", views.WalletView.as_view()),
    path("wallet/ledger/", views.LedgerListView.as_view()),
    path("wallet/topup/code/", views.TopUpCodeView.as_view()),
    path("wallet/topup/phone/", views.TopUpPhoneView.as_view()),
    path("admin/topup-codes/", views.AdminTopUpCodeView.as_view()),
]
