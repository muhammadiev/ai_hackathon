from rest_framework import serializers
from .models import Wallet, LedgerEntry, TopUpCode


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ("balance", "currency", "updated_at")


class LedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = (
            "id",
            "kind",
            "amount",
            "balance_after",
            "title",
            "reference",
            "created_at",
        )


class TopUpCodeSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=32)


class TopUpPhoneSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=32)
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)


class AdminCodeCreateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=32)
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    max_redemptions = serializers.IntegerField(default=100, min_value=1)
    note = serializers.CharField(required=False, allow_blank=True, default="")
