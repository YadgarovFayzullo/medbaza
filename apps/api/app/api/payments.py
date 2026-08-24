"""Payment webhooks.

The provider is not chosen (CLAUDE.md §4) — the boundary is. This endpoint
verifies through the adapter, records the event, and returns fast; the real
work happens in a job (§5.6).
"""

import logging

from fastapi import APIRouter, Request, Response, status
from sqlalchemy.exc import IntegrityError

from app.api.deps import Transaction
from app.auth import DbSession
from app.core.errors import ValidationError
from app.models.infra import WebhookEvent
from app.schemas.common import OkResponse
from app.services import order_service, outbox_service
from app.services.payments import get_payment_provider
from app.services.payments.base import WebhookSignatureError

router = APIRouter(prefix="/payments", tags=["payments"], dependencies=[Transaction])
logger = logging.getLogger(__name__)


@router.post(
    "/webhook",
    response_model=OkResponse,
    status_code=status.HTTP_200_OK,
    operation_id="handlePaymentWebhook",
)
async def handle_webhook(request: Request, session: DbSession, response: Response) -> OkResponse:
    """Receive a provider event.

    The signature is verified before anything in the body is trusted. The
    provider's event ID is inserted into a uniquely-indexed table first: a
    duplicate insert means "already processed", which returns 200 and stops.
    """
    raw_body = await request.body()
    provider = get_payment_provider()
    try:
        event = await provider.parse_webhook(raw_body, dict(request.headers))
    except WebhookSignatureError as exc:
        # Log the failure without the payload — it may carry buyer data.
        logger.warning("payment webhook rejected", extra={"reason": type(exc).__name__})
        raise ValidationError(
            "Webhook imzosini tekshirib bo‘lmadi.",
            code="INVALID_WEBHOOK_SIGNATURE",
            status=400,
        ) from exc

    session.add(
        WebhookEvent(
            provider=getattr(provider, "name", "unknown"),
            provider_event_id=event.provider_event_id,
            event_type=str(event.type),
        )
    )
    try:
        await session.flush()
    except IntegrityError:
        await session.rollback()
        logger.info("payment webhook already processed", extra={"event_type": str(event.type)})
        return OkResponse()

    # Reconcile synchronously — it is a handful of row updates — and hand the
    # side effects (email, payout bookkeeping) to the outbox.
    await order_service.apply_payment_event(
        session,
        payment_ref=event.payment_ref,
        event_type=str(event.type),
        amount_minor=event.amount_minor,
        currency=event.currency,
    )
    await outbox_service.emit(
        session,
        outbox_service.ORDER_PAID if str(event.type) == "payment.succeeded" else "payment.event",
        {"payment_ref": event.payment_ref, "event_type": str(event.type)},
    )
    return OkResponse()
