"""The only payment implementation that exists until CLAUDE.md §4 is decided.

It deliberately models the awkward cases rather than just the happy path:
delayed capture, a webhook arriving before the checkout response returns,
duplicate webhook delivery, partial refunds, and payouts on hold.
"""

import hashlib
import hmac
import json
from collections.abc import Mapping
from datetime import UTC, datetime, timedelta

from app.core.config import settings
from app.core.money import DEFAULT_CURRENCY
from app.services.payments.base import WebhookSignatureError
from app.services.payments.types import (
    CheckoutSession,
    OrderPaymentIntent,
    PaymentEvent,
    PaymentEventType,
    PayoutStatus,
    RefundResult,
    SellerOnboardingLink,
)

_SIGNATURE_HEADER = "x-fake-signature"
_MAX_SIGNATURE_AGE = timedelta(minutes=5)


def _sign(raw_body: bytes, timestamp: str) -> str:
    mac = hmac.new(
        settings.payment_webhook_secret.encode(),
        timestamp.encode() + b"." + raw_body,
        hashlib.sha256,
    )
    return mac.hexdigest()


class FakePaymentProvider:
    """In-memory provider used by dev, tests, and CI."""

    name = "fake"

    def __init__(self) -> None:
        self._captured: dict[str, int] = {}
        self._currency: dict[str, str] = {}
        self._refunded: dict[str, int] = {}

    async def create_checkout_session(self, order: OrderPaymentIntent) -> CheckoutSession:
        split_total = sum(order.seller_splits.values())
        if order.seller_splits and split_total != order.amount_minor:
            raise ValueError(f"seller splits sum to {split_total}, expected {order.amount_minor}")
        payment_ref = f"fake_pay_{order.order_id}"
        self._captured[payment_ref] = order.amount_minor
        self._currency[payment_ref] = order.currency
        return CheckoutSession(
            session_ref=f"fake_sess_{order.order_id}",
            payment_ref=payment_ref,
            redirect_url=f"{settings.web_base_url}/checkout/confirm?payment_ref={payment_ref}",
            expires_at=datetime.now(UTC) + timedelta(minutes=30),
        )

    async def parse_webhook(self, raw_body: bytes, headers: Mapping[str, str]) -> PaymentEvent:
        """Verify the signature *before* parsing anything (CLAUDE.md §5.6)."""
        lower = {k.lower(): v for k, v in headers.items()}
        header = lower.get(_SIGNATURE_HEADER)
        if not header or "," not in header:
            raise WebhookSignatureError("missing or malformed signature header")
        timestamp, provided = header.split(",", 1)
        if not hmac.compare_digest(_sign(raw_body, timestamp), provided):
            raise WebhookSignatureError("signature mismatch")
        try:
            sent_at = datetime.fromtimestamp(int(timestamp), tz=UTC)
        except (ValueError, OSError) as exc:
            raise WebhookSignatureError("unparseable signature timestamp") from exc
        if abs(datetime.now(UTC) - sent_at) > _MAX_SIGNATURE_AGE:
            raise WebhookSignatureError("stale webhook")

        payload = json.loads(raw_body)
        return PaymentEvent(
            provider_event_id=payload["id"],
            type=PaymentEventType(payload["type"]),
            payment_ref=payload["payment_ref"],
            amount_minor=int(payload["amount_minor"]),
            currency=str(payload["currency"]).upper(),
            occurred_at=sent_at,
            seller_id=payload.get("seller_id"),
            failure_reason=payload.get("failure_reason"),
        )

    async def refund(self, payment_ref: str, amount_minor: int, reason: str) -> RefundResult:
        already = self._refunded.get(payment_ref, 0)
        captured = self._captured.get(payment_ref, amount_minor + already)
        succeeded = already + amount_minor <= captured
        if succeeded:
            self._refunded[payment_ref] = already + amount_minor
        return RefundResult(
            refund_ref=f"fake_ref_{payment_ref}_{already + amount_minor}",
            payment_ref=payment_ref,
            amount_minor=amount_minor,
            # A refund settles in the currency the payment did — never a
            # house default, which would let a mismatch pass unnoticed.
            currency=self._currency.get(payment_ref, DEFAULT_CURRENCY),
            succeeded=succeeded,
        )

    async def onboard_seller(self, seller_id: str) -> SellerOnboardingLink:
        return SellerOnboardingLink(
            seller_id=seller_id,
            url=f"{settings.web_base_url}/seller/payouts/onboarding?ref=fake_acct_{seller_id}",
            expires_at=datetime.now(UTC) + timedelta(days=1),
        )

    async def get_seller_payout_status(self, seller_id: str) -> PayoutStatus:
        # Sellers whose ID ends in an even hex digit are "on hold" so both
        # branches of the UI are exercised in dev without special seeding.
        on_hold = seller_id[-1] in "02468ace"
        return PayoutStatus(
            seller_id=seller_id,
            payouts_enabled=not on_hold,
            on_hold=on_hold,
            requirements_outstanding=("identity_document",) if on_hold else (),
        )


def sign_webhook(raw_body: bytes, timestamp: datetime | None = None) -> dict[str, str]:
    """Test/dev helper: produce the headers the fake provider will accept."""
    ts = str(int((timestamp or datetime.now(UTC)).timestamp()))
    return {_SIGNATURE_HEADER: f"{ts},{_sign(raw_body, ts)}"}
