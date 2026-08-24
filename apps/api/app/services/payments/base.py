"""The payment port. Everything in the app depends on this and nothing else."""

from collections.abc import Mapping
from typing import Protocol, runtime_checkable

from app.services.payments.types import (
    CheckoutSession,
    OrderPaymentIntent,
    PaymentEvent,
    PayoutStatus,
    RefundResult,
    SellerOnboardingLink,
)


@runtime_checkable
class PaymentProvider(Protocol):
    async def create_checkout_session(self, order: OrderPaymentIntent) -> CheckoutSession: ...

    async def parse_webhook(self, raw_body: bytes, headers: Mapping[str, str]) -> PaymentEvent: ...

    async def refund(self, payment_ref: str, amount_minor: int, reason: str) -> RefundResult: ...

    async def onboard_seller(self, seller_id: str) -> SellerOnboardingLink: ...

    async def get_seller_payout_status(self, seller_id: str) -> PayoutStatus: ...


class PaymentProviderError(Exception):
    """Raised by an adapter when the provider rejects or cannot process a call."""


class WebhookSignatureError(PaymentProviderError):
    """Signature missing, malformed, or stale. Never process the payload."""
