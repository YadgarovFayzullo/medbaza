"""Outbox poller: turns committed intents into enqueued jobs (CLAUDE.md §3.6).

Delivery is at-least-once, so every job it enqueues must be idempotent.
"""

import logging
from typing import Any

from app.db.session import SessionLocal
from app.services import outbox_service

logger = logging.getLogger(__name__)

# Which job each outbox event type turns into.
ROUTES: dict[str, str] = {
    outbox_service.ORDER_PLACED: "send_order_confirmation",
    outbox_service.ORDER_PAID: "send_order_confirmation",
    outbox_service.PRESCRIPTION_REVIEWED: "send_prescription_decision",
    outbox_service.PRODUCT_REINDEX: "revalidate_storefront",
}

MAX_ATTEMPTS = 5


async def dispatch_outbox(ctx: dict[str, Any]) -> int:
    """Claim pending events and enqueue their jobs. Runs on a short cron."""
    redis = ctx["redis"]
    dispatched = 0

    async with SessionLocal() as session:
        events = await outbox_service.claim_undispatched(session)
        for event in events:
            job = ROUTES.get(event.event_type)
            if job is None:
                # Nothing listens to this type yet; retiring it keeps the table small.
                await outbox_service.mark_dispatched(session, event)
                continue
            try:
                argument = (
                    event.payload.get("order_id")
                    or event.payload.get("prescription_id")
                    or event.payload.get("shipment_id")
                    or event.payload.get("product_id")
                )
                await redis.enqueue_job(job, argument)
                await outbox_service.mark_dispatched(session, event)
                dispatched += 1
            except Exception as exc:  # noqa: BLE001 - recorded, retried, then dead-lettered
                await outbox_service.mark_failed(session, event, str(exc))
                if event.attempts >= MAX_ATTEMPTS:
                    logger.error(
                        "outbox event exhausted retries",
                        extra={"event_id": event.id, "event_type": event.event_type},
                    )
        await session.commit()

    if dispatched:
        logger.info("outbox dispatched", extra={"count": dispatched})
    return dispatched
