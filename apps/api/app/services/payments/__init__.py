"""Payments package. The concrete provider is resolved in exactly one place."""

from functools import lru_cache

from app.core.config import settings
from app.services.payments.adapters.fake import FakePaymentProvider
from app.services.payments.base import PaymentProvider


@lru_cache
def get_payment_provider() -> PaymentProvider:
    """Resolve the provider named by `PAYMENT_PROVIDER`.

    `fake` is the only implementation until CLAUDE.md §4 is decided. Adding a
    real one means adding a branch here and an adapter module — nothing else in
    the app changes.
    """
    match settings.payment_provider:
        case "fake":
            return FakePaymentProvider()
        case other:  # pragma: no cover - guard for a misconfigured environment
            raise RuntimeError(
                f"Unknown PAYMENT_PROVIDER {other!r}. "
                "Only 'fake' exists until the provider decision in CLAUDE.md §4 is made."
            )


__all__ = ["PaymentProvider", "get_payment_provider"]
