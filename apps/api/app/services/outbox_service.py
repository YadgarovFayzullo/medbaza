"""Transactional outbox (CLAUDE.md §3.6).

Services record an intent inside the request transaction; the poller in
`app.workers` enqueues it afterwards. Nothing is ever enqueued inline, so a
rolled-back transaction can never leave an email or webhook already sent.
"""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.infra import OutboxEvent

# Event types. Payloads are IDs and primitives only — never nested objects.
ORDER_PLACED = "order.placed"
ORDER_PAID = "order.paid"
SHIPMENT_STATUS_CHANGED = "shipment.status_changed"
PRESCRIPTION_SUBMITTED = "prescription.submitted"
PRESCRIPTION_REVIEWED = "prescription.reviewed"
SELLER_VERIFICATION_CHANGED = "seller.verification_changed"
PRODUCT_REINDEX = "product.reindex"


def _assert_primitive(payload: dict[str, Any]) -> None:
    for key, value in payload.items():
        if not isinstance(value, str | int | float | bool | type(None)):
            raise TypeError(
                f"outbox payload field {key!r} must be a primitive; "
                "jobs re-read state from the database rather than carrying it"
            )


async def emit(session: AsyncSession, event_type: str, payload: dict[str, Any]) -> OutboxEvent:
    """Queue an event to be dispatched after the current transaction commits.

    Must be called inside an existing transaction.
    """
    _assert_primitive(payload)
    event = OutboxEvent(event_type=event_type, payload=payload)
    session.add(event)
    return event


async def claim_undispatched(session: AsyncSession, limit: int = 100) -> list[OutboxEvent]:
    """Fetch pending events for the poller, locking them against a second worker."""
    stmt = (
        select(OutboxEvent)
        .where(OutboxEvent.dispatched_at.is_(None))
        .order_by(OutboxEvent.id)
        .limit(limit)
        .with_for_update(skip_locked=True)
    )
    return list((await session.execute(stmt)).scalars())


async def mark_dispatched(session: AsyncSession, event: OutboxEvent) -> None:
    event.dispatched_at = datetime.now(UTC)


async def mark_failed(session: AsyncSession, event: OutboxEvent, error: str) -> None:
    event.attempts += 1
    # Truncated so a driver traceback can never smuggle payload data into the row.
    event.last_error = error[:500]
