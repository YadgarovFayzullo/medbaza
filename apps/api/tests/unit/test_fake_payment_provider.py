"""The fake provider must model the awkward cases, not just the happy path (§4)."""

import json
from datetime import UTC, datetime, timedelta

import pytest

from app.services.payments import get_payment_provider
from app.services.payments.adapters.fake import FakePaymentProvider, sign_webhook
from app.services.payments.base import PaymentProvider, WebhookSignatureError
from app.services.payments.types import OrderPaymentIntent, PaymentEventType


def test_factory_returns_the_port() -> None:
    provider = get_payment_provider()
    assert isinstance(provider, PaymentProvider)


async def test_checkout_session_rejects_splits_that_do_not_reconcile() -> None:
    provider = FakePaymentProvider()
    with pytest.raises(ValueError):
        await provider.create_checkout_session(
            OrderPaymentIntent(
                order_id="o1",
                amount_minor=1000,
                currency="USD",
                buyer_reference="b1",
                seller_splits={"s1": 600, "s2": 300},
            )
        )


async def test_webhook_requires_a_valid_signature() -> None:
    provider = FakePaymentProvider()
    body = json.dumps(
        {
            "id": "evt_1",
            "type": "payment.succeeded",
            "payment_ref": "fake_pay_o1",
            "amount_minor": 1000,
            "currency": "usd",
        }
    ).encode()

    with pytest.raises(WebhookSignatureError):
        await provider.parse_webhook(body, {})
    with pytest.raises(WebhookSignatureError):
        await provider.parse_webhook(body, {"x-fake-signature": "123,deadbeef"})

    event = await provider.parse_webhook(body, sign_webhook(body))
    assert event.type is PaymentEventType.PAYMENT_SUCCEEDED
    assert event.currency == "USD"


async def test_stale_webhooks_are_rejected() -> None:
    provider = FakePaymentProvider()
    body = json.dumps(
        {
            "id": "evt_2",
            "type": "payment.succeeded",
            "payment_ref": "fake_pay_o1",
            "amount_minor": 1000,
            "currency": "USD",
        }
    ).encode()
    stale = sign_webhook(body, datetime.now(UTC) - timedelta(hours=1))
    with pytest.raises(WebhookSignatureError):
        await provider.parse_webhook(body, stale)


async def test_partial_refunds_accumulate_and_stop_at_the_captured_amount() -> None:
    provider = FakePaymentProvider()
    session = await provider.create_checkout_session(
        OrderPaymentIntent(order_id="o2", amount_minor=5000, currency="USD", buyer_reference="b1")
    )
    first = await provider.refund(session.payment_ref, 2000, "damaged")
    second = await provider.refund(session.payment_ref, 3000, "remainder")
    third = await provider.refund(session.payment_ref, 1, "over-refund")
    assert first.succeeded and second.succeeded
    assert not third.succeeded
    # The refund settles in the payment's currency, not the platform default.
    assert first.currency == "USD"


async def test_payout_status_covers_the_on_hold_branch() -> None:
    provider = FakePaymentProvider()
    held = await provider.get_seller_payout_status("seller-2")
    ready = await provider.get_seller_payout_status("seller-1")
    assert held.on_hold and not held.payouts_enabled
    assert ready.payouts_enabled and not ready.on_hold
