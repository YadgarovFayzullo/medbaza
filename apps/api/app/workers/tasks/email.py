"""Transactional email jobs.

Arguments are IDs only; the job re-reads current state (CLAUDE.md §3.6). No
address, name, or health detail is ever passed in or logged.
"""

import logging
from typing import Any

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.order import Order
from app.models.prescription import Prescription
from app.models.user import User

logger = logging.getLogger(__name__)


async def _send(to: str, subject: str, body: str) -> None:
    """Hand the message to the provider.

    Without `EMAIL_API_KEY` configured this logs that a send was skipped —
    never the recipient or the body (§12.2).
    """
    if not settings.email_api_key:
        logger.info("email skipped: provider not configured", extra={"subject": subject})
        return
    # The provider client lives behind this function so no SDK type leaks out.
    raise NotImplementedError("Wire the Resend/Postmark client here.")


async def send_order_confirmation(ctx: dict[str, Any], order_id: str) -> None:
    """Idempotent: re-sending a confirmation is harmless."""
    async with SessionLocal() as session:
        order = await session.get(Order, order_id)
        if order is None:
            logger.warning("order missing for confirmation", extra={"order_id": order_id})
            return
        recipient = order.guest_email or (order.buyer.email if order.buyer else None)
        if not recipient:
            return
        await _send(recipient, f"Order {order.number} confirmed", "")
    logger.info("order confirmation sent", extra={"order_id": order_id})


async def send_prescription_decision(ctx: dict[str, Any], prescription_id: str) -> None:
    async with SessionLocal() as session:
        prescription = await session.get(Prescription, prescription_id)
        if prescription is None:
            return
        user = await session.get(User, prescription.user_id)
        if user is None:
            return
        # Subject names the decision, never the document or the condition.
        await _send(user.email, "An update on your prescription review", "")
    logger.info("prescription decision sent", extra={"prescription_id": prescription_id})
