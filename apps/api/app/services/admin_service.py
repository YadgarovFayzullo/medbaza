"""Staff oversight: seller approval, order oversight, user management."""

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import NotFoundError, ValidationError
from app.core.money import DEFAULT_CURRENCY
from app.core.pagination import decode_cursor, encode_cursor
from app.models.enums import (
    PrescriptionStatus,
    ProductStatus,
    SellerStatus,
    ShipmentStatus,
    UserRole,
)
from app.models.order import Order, Shipment
from app.models.prescription import Prescription
from app.models.product import Product
from app.models.seller import Seller
from app.models.user import User
from app.services import audit_service, order_service


async def stats(session: AsyncSession) -> dict[str, Any]:
    since = datetime.now(UTC) - timedelta(days=7)

    async def _scalar(stmt: Any) -> int:
        return int(await session.scalar(stmt) or 0)

    recent_orders = list(
        (await session.execute(select(Order).where(Order.created_at >= since))).scalars()
    )
    return {
        "pending_sellers": await _scalar(
            select(func.count(Seller.id)).where(Seller.status == SellerStatus.PENDING)
        ),
        "pending_prescriptions": await _scalar(
            select(func.count(Prescription.id)).where(
                Prescription.status == PrescriptionStatus.PENDING_REVIEW
            )
        ),
        "orders_last_7d": len(recent_orders),
        "gmv_last_7d_minor": sum(o.total_amount_minor for o in recent_orders),
        "currency": recent_orders[0].currency if recent_orders else DEFAULT_CURRENCY,
        "active_products": await _scalar(
            select(func.count(Product.id)).where(Product.status == ProductStatus.ACTIVE)
        ),
        "open_shipments": await _scalar(
            select(func.count(Shipment.id)).where(
                Shipment.status.in_((ShipmentStatus.PAID, ShipmentStatus.PROCESSING))
            )
        ),
    }


async def list_sellers(
    session: AsyncSession,
    *,
    status: str | None = None,
    limit: int = 20,
    cursor: str | None = None,
) -> tuple[list[tuple[Seller, int]], str | None]:
    stmt = select(Seller).order_by(Seller.id.desc())
    if status:
        stmt = stmt.where(Seller.status == status)
    if cursor and (decoded := decode_cursor(cursor)):
        stmt = stmt.where(Seller.id < decoded[1])
    rows = list((await session.execute(stmt.limit(limit + 1))).scalars())
    next_cursor = encode_cursor(None, rows[limit - 1].id) if len(rows) > limit else None
    page = rows[:limit]

    counts = {
        row[0]: row[1]
        for row in await session.execute(
            select(Product.seller_id, func.count(Product.id))
            .where(Product.seller_id.in_([s.id for s in page] or [""]))
            .group_by(Product.seller_id)
        )
    }
    return [(s, counts.get(s.id, 0)) for s in page], next_cursor


async def list_users(
    session: AsyncSession,
    *,
    role: str | None = None,
    q: str | None = None,
    limit: int = 20,
    cursor: str | None = None,
) -> tuple[list[User], str | None]:
    stmt = select(User).order_by(User.id.desc())
    if role:
        stmt = stmt.where(User.role == role)
    if q:
        stmt = stmt.where(func.lower(User.email).like(f"%{q.lower()}%"))
    if cursor and (decoded := decode_cursor(cursor)):
        stmt = stmt.where(User.id < decoded[1])
    rows = list((await session.execute(stmt.limit(limit + 1))).scalars())
    next_cursor = encode_cursor(None, rows[limit - 1].id) if len(rows) > limit else None
    return rows[:limit], next_cursor


async def update_user(
    session: AsyncSession,
    *,
    user_id: str,
    role: str | None,
    is_active: bool | None,
    reason: str | None,
    admin: User,
    ip_address: str | None = None,
) -> User:
    """Change a user's role or deactivate them. Both actions are audited (§12.3)."""
    user = await session.get(User, user_id)
    if user is None:
        raise NotFoundError("Bunday foydalanuvchi mavjud emas.")
    if user.id == admin.id and (is_active is False or (role and role != UserRole.ADMIN)):
        raise ValidationError(
            "O‘zingizning admin huquqingizni olib tashlay olmaysiz.",
            code="CANNOT_DEMOTE_SELF",
            status=409,
        )

    if role is not None and role != user.role:
        user.role = role
        await audit_service.record(
            session,
            actor_id=admin.id,
            actor_role=UserRole.ADMIN,
            action=audit_service.USER_ROLE_CHANGED,
            subject_type="user",
            subject_id=user.id,
            ip_address=ip_address,
            metadata={"role": role, "reason": reason},
        )
    if is_active is not None and is_active != user.is_active:
        user.is_active = is_active
        if not is_active:
            await audit_service.record(
                session,
                actor_id=admin.id,
                actor_role=UserRole.ADMIN,
                action=audit_service.USER_DEACTIVATED,
                subject_type="user",
                subject_id=user.id,
                ip_address=ip_address,
                metadata={"reason": reason},
            )
    await session.flush()
    return user


async def list_orders(
    session: AsyncSession,
    *,
    status: str | None = None,
    limit: int = 20,
    cursor: str | None = None,
) -> tuple[list[Order], str | None]:
    stmt = (
        select(Order)
        .options(selectinload(Order.shipments).selectinload(Shipment.items))
        .order_by(Order.id.desc())
    )
    if cursor and (decoded := decode_cursor(cursor)):
        stmt = stmt.where(Order.id < decoded[1])
    rows = list((await session.execute(stmt.limit(limit + 1))).scalars().unique())
    if status:
        # Order status is derived, so it is filtered after the shipments load.
        rows = [o for o in rows if o.status == status]
    next_cursor = encode_cursor(None, rows[limit - 1].id) if len(rows) > limit else None
    return rows[:limit], next_cursor


async def get_order(session: AsyncSession, order_id: str) -> Order:
    order = (
        await session.execute(
            select(Order)
            .where(Order.id == order_id)
            .options(
                selectinload(Order.shipments).selectinload(Shipment.items),
                selectinload(Order.shipments).selectinload(Shipment.seller),
                selectinload(Order.events),
                selectinload(Order.prescription),
            )
        )
    ).scalar_one_or_none()
    if order is None:
        raise NotFoundError("Bunday buyurtma mavjud emas.")
    return order


async def transition_shipment(
    session: AsyncSession,
    *,
    shipment_id: str,
    to_status: str,
    reason: str | None,
    admin: User,
    ip_address: str | None = None,
) -> Shipment:
    """Admin override of a shipment's state. Always audited (§12.3)."""
    shipment = (
        await session.execute(
            select(Shipment)
            .where(Shipment.id == shipment_id)
            .options(selectinload(Shipment.items), selectinload(Shipment.order))
        )
    ).scalar_one_or_none()
    if shipment is None:
        raise NotFoundError("Bunday jo‘natma mavjud emas.")

    from_status = shipment.status
    updated = await order_service.transition_shipment(
        session,
        shipment,
        to_status,
        actor_id=admin.id,
        actor_role=UserRole.ADMIN,
        reason=reason,
    )
    action = (
        audit_service.REFUND_ISSUED
        if to_status == ShipmentStatus.REFUNDED
        else audit_service.ORDER_STATE_CHANGED_BY_ADMIN
    )
    await audit_service.record(
        session,
        actor_id=admin.id,
        actor_role=UserRole.ADMIN,
        action=action,
        subject_type="shipment",
        subject_id=shipment.id,
        ip_address=ip_address,
        metadata={"from": from_status, "to": to_status, "reason": reason},
    )
    return updated
