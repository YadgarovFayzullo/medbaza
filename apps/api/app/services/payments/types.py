"""Provider-agnostic payment dataclasses.

No payment-provider type ever crosses this boundary (CLAUDE.md §3.7/§4). If a
concrete PSP is added later, its SDK types are translated into these inside
`adapters/` and nowhere else.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum


class PaymentEventType(StrEnum):
    PAYMENT_SUCCEEDED = "payment.succeeded"
    PAYMENT_FAILED = "payment.failed"
    PAYMENT_REFUNDED = "payment.refunded"
    PAYOUT_UPDATED = "payout.updated"


@dataclass(frozen=True, slots=True)
class OrderPaymentIntent:
    """What we want to charge for. IDs and money only — no cart, no PHI."""

    order_id: str
    amount_minor: int
    currency: str
    buyer_reference: str
    # Per-seller split: seller_id -> amount in minor units. Sums to amount_minor.
    seller_splits: dict[str, int] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class CheckoutSession:
    session_ref: str
    payment_ref: str
    redirect_url: str
    expires_at: datetime | None = None


@dataclass(frozen=True, slots=True)
class PaymentEvent:
    provider_event_id: str
    type: PaymentEventType
    payment_ref: str
    amount_minor: int
    currency: str
    occurred_at: datetime
    seller_id: str | None = None
    failure_reason: str | None = None


@dataclass(frozen=True, slots=True)
class RefundResult:
    refund_ref: str
    payment_ref: str
    amount_minor: int
    currency: str
    succeeded: bool


@dataclass(frozen=True, slots=True)
class SellerOnboardingLink:
    seller_id: str
    url: str
    expires_at: datetime | None = None


@dataclass(frozen=True, slots=True)
class PayoutStatus:
    seller_id: str
    payouts_enabled: bool
    on_hold: bool = False
    requirements_outstanding: tuple[str, ...] = ()
