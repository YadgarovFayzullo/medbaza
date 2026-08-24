"""Orders, shipments, and the one place shipment status is ever assigned."""

import hashlib
import json
import secrets
from collections import defaultdict
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import (
    AppError,
    EmptyCartError,
    IdempotencyConflictError,
    InvalidStateTransitionError,
    MixedCurrencyError,
    NotFoundError,
    PrescriptionNotApprovedError,
    PrescriptionRequiredError,
    ValidationError,
)
from app.core.money import normalise_currency
from app.models.cart import Cart
from app.models.enums import PrescriptionStatus, ShipmentStatus
from app.models.infra import IdempotencyKey
from app.models.order import Order, OrderEvent, OrderItem, Shipment
from app.models.prescription import Prescription
from app.services import cart_service, inventory_service, outbox_service, pricing_service

# The allowed-transition map is a module-level constant so it can be covered by
# a table-driven test (CLAUDE.md §5.4).
ALLOWED_TRANSITIONS: dict[str, frozenset[str]] = {
    ShipmentStatus.PENDING_PAYMENT: frozenset(
        {ShipmentStatus.PAID, ShipmentStatus.PAYMENT_FAILED, ShipmentStatus.CANCELLED}
    ),
    ShipmentStatus.PAYMENT_FAILED: frozenset({ShipmentStatus.CANCELLED, ShipmentStatus.PAID}),
    ShipmentStatus.PAID: frozenset(
        {ShipmentStatus.PROCESSING, ShipmentStatus.CANCELLED, ShipmentStatus.REFUNDED}
    ),
    ShipmentStatus.PROCESSING: frozenset(
        {ShipmentStatus.SHIPPED, ShipmentStatus.CANCELLED, ShipmentStatus.REFUNDED}
    ),
    ShipmentStatus.SHIPPED: frozenset({ShipmentStatus.DELIVERED, ShipmentStatus.REFUNDED}),
    ShipmentStatus.DELIVERED: frozenset({ShipmentStatus.RETURN_REQUESTED, ShipmentStatus.REFUNDED}),
    ShipmentStatus.RETURN_REQUESTED: frozenset({ShipmentStatus.RETURNED, ShipmentStatus.DELIVERED}),
    ShipmentStatus.RETURNED: frozenset({ShipmentStatus.REFUNDED}),
    ShipmentStatus.CANCELLED: frozenset(),
    ShipmentStatus.REFUNDED: frozenset(),
}

# Leaving `paid` requires an approved prescription when the order is gated (§5.5).
_PRESCRIPTION_GATED_TARGETS = frozenset({ShipmentStatus.PROCESSING, ShipmentStatus.SHIPPED})

# Before a shipment leaves the warehouse, cancelling puts the stock back.
_STOCK_HOLDING_STATUSES = frozenset(
    {
        ShipmentStatus.PENDING_PAYMENT,
        ShipmentStatus.PAID,
        ShipmentStatus.PROCESSING,
        ShipmentStatus.PAYMENT_FAILED,
    }
)

IDEMPOTENCY_TTL = timedelta(hours=24)


def _order_number() -> str:
    return f"MB-{datetime.now(UTC):%Y%m}-{secrets.token_hex(3).upper()}"


# --- state machine --------------------------------------------------------


async def transition_shipment(
    session: AsyncSession,
    shipment: Shipment,
    to_status: str,
    *,
    actor_id: str | None,
    actor_role: str = "system",
    reason: str | None = None,
    carrier: str | None = None,
    tracking_number: str | None = None,
) -> Shipment:
    """The only place `Shipment.status` is ever assigned (CLAUDE.md §5.4).

    Must be called inside an existing transaction. Writes an `OrderEvent` for
    every transition and restores stock when a pre-shipment cancellation
    happens — nothing else decrements or releases stock on this path.
    """
    from_status = shipment.status
    if to_status == from_status:
        return shipment
    if to_status not in ALLOWED_TRANSITIONS.get(from_status, frozenset()):
        raise InvalidStateTransitionError(
            f"Jo‘natmani {from_status} holatidan {to_status} holatiga o‘tkazib bo‘lmaydi.",
            details={"shipment_id": shipment.id, "from": from_status, "to": to_status},
        )

    order = (
        shipment.order
        if shipment.order is not None
        else await session.get(Order, shipment.order_id)
    )
    if (
        to_status in _PRESCRIPTION_GATED_TARGETS
        and order is not None
        and order.prescription_required
    ):
        prescription = (
            await session.get(Prescription, order.prescription_id)
            if order.prescription_id
            else None
        )
        if prescription is None or prescription.status != PrescriptionStatus.APPROVED:
            raise PrescriptionNotApprovedError(
                details={"order_id": order.id},
            )

    if to_status == ShipmentStatus.CANCELLED and from_status in _STOCK_HOLDING_STATUSES:
        await inventory_service.release_stock(
            session,
            {item.product_id: item.quantity for item in shipment.items if item.product_id},
        )
    elif to_status == ShipmentStatus.CANCELLED:
        # After dispatch, the route back is a return — never a cancellation (§5.4).
        raise InvalidStateTransitionError(
            "Jo‘natilgan buyurtmani bekor qilib bo‘lmaydi, faqat qaytarish mumkin.",
            details={"shipment_id": shipment.id},
        )

    shipment.status = to_status
    if carrier is not None:
        shipment.carrier = carrier
    if tracking_number is not None:
        shipment.tracking_number = tracking_number

    session.add(
        OrderEvent(
            order_id=shipment.order_id,
            shipment_id=shipment.id,
            actor_id=actor_id,
            actor_role=actor_role,
            from_status=from_status,
            to_status=to_status,
            reason=reason,
        )
    )
    await outbox_service.emit(
        session,
        outbox_service.SHIPMENT_STATUS_CHANGED,
        {"shipment_id": shipment.id, "order_id": shipment.order_id, "to_status": to_status},
    )
    await session.flush()
    return shipment


# --- checkout -------------------------------------------------------------


def _request_hash(payload: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


async def replay_idempotent(
    session: AsyncSession, *, key: str, endpoint: str, payload: dict[str, Any]
) -> dict[str, Any] | None:
    """Return the stored response for a repeated key, or None on first use.

    A key reused with a *different* body is a client bug, not a retry, and is
    rejected rather than silently creating a second order (§5.6).
    """
    row = (
        await session.execute(
            select(IdempotencyKey).where(
                IdempotencyKey.key == key, IdempotencyKey.endpoint == endpoint
            )
        )
    ).scalar_one_or_none()
    if row is None:
        return None
    if row.request_hash != _request_hash(payload):
        raise IdempotencyConflictError()
    return row.response_json


async def store_idempotent(
    session: AsyncSession,
    *,
    key: str,
    endpoint: str,
    payload: dict[str, Any],
    response: dict[str, Any],
) -> None:
    session.add(
        IdempotencyKey(
            key=key,
            endpoint=endpoint,
            request_hash=_request_hash(payload),
            response_json=response,
            expires_at=datetime.now(UTC) + IDEMPOTENCY_TTL,
        )
    )


async def create_order(
    session: AsyncSession,
    *,
    cart: Cart,
    buyer_id: str | None,
    guest_email: str | None,
    address: Any,
    prescription_id: str | None,
) -> Order:
    """Turn a cart into an order: one order, one shipment per seller.

    Totals are computed server-side from the catalog, never from anything the
    client sent (§5.2). Stock is committed here, inside this transaction, under
    the row lock in `inventory_service` (§5.3).
    """
    if not cart.items:
        raise EmptyCartError()

    summary = cart_service.summarise(cart)
    if len(summary["currencies"]) > 1:
        raise MixedCurrencyError()
    currency = normalise_currency(summary["currency"])

    if buyer_id is None and not guest_email:
        raise ValidationError(
            "Mehmon sifatida rasmiylashtirish uchun pochta manzili kerak.",
            details={"field": "email"},
        )

    prescription: Prescription | None = None
    if summary["prescription_required"]:
        if not prescription_id:
            raise PrescriptionRequiredError()
        prescription = await session.get(Prescription, prescription_id)
        # A prescription belonging to someone else is treated as non-existent (§3.5).
        if prescription is None or (buyer_id is not None and prescription.user_id != buyer_id):
            raise NotFoundError("Bunday retsept mavjud emas.")
        if prescription.status == PrescriptionStatus.REJECTED:
            raise PrescriptionNotApprovedError("Bu retsept rad etilgan.")

    # Commit stock under the lock before any row referencing it is written.
    quantities: dict[str, int] = defaultdict(int)
    for item in cart.items:
        quantities[item.product_id] += item.quantity
    await inventory_service.commit_stock(session, quantities)

    order = Order(
        number=_order_number(),
        buyer_id=buyer_id,
        guest_email=None if buyer_id else guest_email,
        currency=currency,
        items_amount_minor=summary["items_amount_minor"],
        shipping_amount_minor=summary["shipping_amount_minor"],
        tax_amount_minor=0,
        total_amount_minor=summary["total_amount_minor"],
        ship_recipient_name=address.recipient_name,
        ship_line1=address.line1,
        ship_line2=address.line2,
        ship_city=address.city,
        ship_region=address.region,
        ship_postal_code=address.postal_code,
        ship_country=address.country.upper(),
        ship_phone=address.phone,
        prescription_required=summary["prescription_required"],
        prescription_id=prescription.id if prescription else None,
    )
    session.add(order)
    await session.flush()

    for group in summary["groups"]:
        seller = group["seller"]
        items_amount = group["subtotal_amount_minor"]
        shipping_amount = pricing_service.shipping_for_group(items_amount)
        shipment = Shipment(
            order_id=order.id,
            seller_id=seller.id,
            status=ShipmentStatus.PENDING_PAYMENT,
            currency=currency,
            items_amount_minor=items_amount,
            shipping_amount_minor=shipping_amount,
            platform_fee_amount_minor=pricing_service.platform_fee(items_amount + shipping_amount),
        )
        session.add(shipment)
        await session.flush()

        for item in group["items"]:
            product = item.product
            session.add(
                OrderItem(
                    shipment_id=shipment.id,
                    product_id=product.id,
                    seller_id=seller.id,
                    product_name=product.name,
                    product_slug=product.slug,
                    sku=product.sku,
                    image_url=product.image_url,
                    prescription_required=product.prescription_required,
                    quantity=item.quantity,
                    unit_amount_minor=product.price_amount_minor,
                    currency=currency,
                )
            )

        session.add(
            OrderEvent(
                order_id=order.id,
                shipment_id=shipment.id,
                actor_id=buyer_id,
                actor_role="buyer" if buyer_id else "guest",
                from_status=None,
                to_status=ShipmentStatus.PENDING_PAYMENT,
                reason="Order placed",
            )
        )

    await outbox_service.emit(
        session, outbox_service.ORDER_PLACED, {"order_id": order.id, "buyer_id": buyer_id or ""}
    )
    await cart_service.clear(session, cart)
    await session.flush()
    return await get_order(session, order.id, buyer_id=buyer_id, allow_guest=buyer_id is None)


def payment_intent_splits(order: Order) -> dict[str, int]:
    """Per-seller amounts for the payment provider, reconciling to the order total."""
    per_seller = {s.seller_id: s.total_amount_minor for s in order.shipments}
    return pricing_service.seller_splits(order.total_amount_minor, per_seller)


# --- reads ----------------------------------------------------------------


def _order_query() -> Any:
    return (
        select(Order).options(
            selectinload(Order.shipments).selectinload(Shipment.items),
            selectinload(Order.shipments).selectinload(Shipment.seller),
            selectinload(Order.events),
            selectinload(Order.prescription),
        )
        # Re-reading after a transition must pick up the new events and
        # statuses rather than the identity map's stale collections.
        .execution_options(populate_existing=True)
    )


async def get_order(
    session: AsyncSession,
    order_id: str,
    *,
    buyer_id: str | None,
    allow_guest: bool = False,
) -> Order:
    """Fetch an order the actor is allowed to see.

    An order belonging to someone else is reported as missing, never forbidden,
    so the API does not leak that it exists (§3.5).
    """
    order: Order | None = (
        await session.execute(_order_query().where(Order.id == order_id))
    ).scalar_one_or_none()
    if order is None:
        raise NotFoundError("Bunday buyurtma mavjud emas.")
    if order.buyer_id is not None and order.buyer_id != buyer_id:
        raise NotFoundError("Bunday buyurtma mavjud emas.")
    if order.buyer_id is None and not allow_guest:
        raise NotFoundError("Bunday buyurtma mavjud emas.")
    return order


async def get_order_by_number(session: AsyncSession, number: str, *, email: str) -> Order:
    """Guest order lookup: the order number alone is not enough."""
    order: Order | None = (
        await session.execute(_order_query().where(Order.number == number))
    ).scalar_one_or_none()
    if order is None or (order.guest_email or "").lower() != email.strip().lower():
        raise NotFoundError("Bu raqam va pochtaga mos buyurtma topilmadi.")
    return order


async def list_buyer_orders(
    session: AsyncSession, buyer_id: str, *, limit: int = 20, cursor: str | None = None
) -> tuple[list[Order], str | None]:
    from app.core.pagination import decode_cursor, encode_cursor

    stmt = _order_query().where(Order.buyer_id == buyer_id).order_by(Order.id.desc())
    if cursor and (decoded := decode_cursor(cursor)):
        stmt = stmt.where(Order.id < decoded[1])
    rows = list((await session.execute(stmt.limit(limit + 1))).scalars().unique())
    next_cursor = encode_cursor(None, rows[limit - 1].id) if len(rows) > limit else None
    return rows[:limit], next_cursor


async def cancel_order(
    session: AsyncSession, order_id: str, *, buyer_id: str, reason: str
) -> Order:
    """Buyer-initiated cancellation. Only shipments that have not shipped can go."""
    order = await get_order(session, order_id, buyer_id=buyer_id)
    cancellable = [s for s in order.shipments if s.status in _STOCK_HOLDING_STATUSES]
    if not cancellable:
        raise InvalidStateTransitionError(
            "Bu buyurtma jo‘natilgan — o‘rniga qaytarish so‘rang.",
            details={"order_id": order.id},
        )
    for shipment in cancellable:
        await transition_shipment(
            session,
            shipment,
            ShipmentStatus.CANCELLED,
            actor_id=buyer_id,
            actor_role="buyer",
            reason=reason,
        )
    return await get_order(session, order.id, buyer_id=buyer_id)


async def request_return(
    session: AsyncSession, *, shipment_id: str, buyer_id: str, reason: str
) -> Shipment:
    shipment = await session.get(Shipment, shipment_id)
    if shipment is None:
        raise NotFoundError("Bunday jo‘natma mavjud emas.")
    order = await get_order(session, shipment.order_id, buyer_id=buyer_id)
    shipment = next(s for s in order.shipments if s.id == shipment_id)
    return await transition_shipment(
        session,
        shipment,
        ShipmentStatus.RETURN_REQUESTED,
        actor_id=buyer_id,
        actor_role="buyer",
        reason=reason,
    )


# --- seller-facing --------------------------------------------------------


async def list_seller_shipments(
    session: AsyncSession,
    seller_id: str,
    *,
    status: str | None = None,
    limit: int = 20,
    cursor: str | None = None,
) -> tuple[list[Shipment], str | None]:
    """A seller sees only their own shipments — the filter is in the query (§3.5)."""
    from app.core.pagination import decode_cursor, encode_cursor

    stmt = (
        select(Shipment)
        .where(Shipment.seller_id == seller_id)
        .options(selectinload(Shipment.items), selectinload(Shipment.order))
        .order_by(Shipment.id.desc())
    )
    if status:
        stmt = stmt.where(Shipment.status == status)
    if cursor and (decoded := decode_cursor(cursor)):
        stmt = stmt.where(Shipment.id < decoded[1])
    rows = list((await session.execute(stmt.limit(limit + 1))).scalars().unique())
    next_cursor = encode_cursor(None, rows[limit - 1].id) if len(rows) > limit else None
    return rows[:limit], next_cursor


async def get_seller_shipment(session: AsyncSession, seller_id: str, shipment_id: str) -> Shipment:
    shipment = (
        await session.execute(
            select(Shipment)
            .where(Shipment.id == shipment_id)
            .options(selectinload(Shipment.items), selectinload(Shipment.order))
        )
    ).scalar_one_or_none()
    if shipment is None or shipment.seller_id != seller_id:
        raise NotFoundError("Bunday jo‘natma mavjud emas.")
    return shipment


async def seller_shipment_events(session: AsyncSession, shipment_id: str) -> list[OrderEvent]:
    result = await session.execute(
        select(OrderEvent)
        .where(OrderEvent.shipment_id == shipment_id)
        .order_by(OrderEvent.id.asc())
    )
    return list(result.scalars())


async def seller_transition(
    session: AsyncSession,
    seller_id: str,
    shipment_id: str,
    *,
    to_status: str,
    actor_id: str,
    carrier: str | None = None,
    tracking_number: str | None = None,
    reason: str | None = None,
) -> Shipment:
    shipment = await get_seller_shipment(session, seller_id, shipment_id)
    if to_status == ShipmentStatus.SHIPPED and not tracking_number:
        raise ValidationError(
            "Jo‘natildi deb belgilash uchun kuzatuv raqami kerak.",
            details={"field": "tracking_number"},
        )
    return await transition_shipment(
        session,
        shipment,
        to_status,
        actor_id=actor_id,
        actor_role="seller",
        reason=reason,
        carrier=carrier,
        tracking_number=tracking_number,
    )


# --- payment reconciliation ----------------------------------------------


async def apply_payment_event(
    session: AsyncSession,
    *,
    payment_ref: str,
    event_type: str,
    amount_minor: int,
    currency: str,
) -> Order | None:
    """Reconcile an order against a payment event: "make it so", not "do next".

    Webhooks arrive out of order and more than once (§5.6), so this reads the
    current state and moves each shipment to where the event says it should be,
    skipping any that are already there.
    """
    order: Order | None = (
        await session.execute(_order_query().where(Order.payment_ref == payment_ref))
    ).scalar_one_or_none()
    if order is None:
        return None

    # Never trust an amount from a webhook without checking it (§5.6).
    if event_type == "payment.succeeded" and (
        amount_minor != order.total_amount_minor or normalise_currency(currency) != order.currency
    ):
        raise ValidationError(
            "To‘lov summasi buyurtma summasiga to‘g‘ri kelmadi.",
            code="PAYMENT_AMOUNT_MISMATCH",
            status=409,
            details={"order_id": order.id},
        )

    target = {
        "payment.succeeded": ShipmentStatus.PAID,
        "payment.failed": ShipmentStatus.PAYMENT_FAILED,
        "payment.refunded": ShipmentStatus.REFUNDED,
    }.get(event_type)
    if target is None:
        return order

    for shipment in order.shipments:
        if shipment.status == target:
            continue
        if target not in ALLOWED_TRANSITIONS.get(shipment.status, frozenset()):
            # Already moved past this point by a later event — nothing to do.
            continue
        try:
            await transition_shipment(
                session,
                shipment,
                target,
                actor_id=None,
                actor_role="system",
                reason=f"Payment event {event_type}",
            )
        except AppError:
            # A gate (e.g. an unapproved prescription) blocks this shipment for
            # now; the order stays paid and the gate is resolved separately.
            continue

    if target == ShipmentStatus.PAID:
        await outbox_service.emit(session, outbox_service.ORDER_PAID, {"order_id": order.id})
    return order


async def order_counts_by_status(session: AsyncSession, seller_id: str) -> dict[str, int]:
    result = await session.execute(
        select(Shipment.status, func.count(Shipment.id))
        .where(Shipment.seller_id == seller_id)
        .group_by(Shipment.status)
    )
    return {row[0]: row[1] for row in result}
