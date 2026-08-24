"""Seller accounts, storefront profiles, and the seller dashboard."""

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.core.money import DEFAULT_CURRENCY
from app.models.enums import ProductStatus, SellerStatus, ShipmentStatus, UserRole
from app.models.order import Shipment
from app.models.product import Product
from app.models.seller import Seller
from app.models.user import User
from app.services import audit_service, catalog_service, outbox_service
from app.services.payments import get_payment_provider

LOW_STOCK_THRESHOLD = 5


async def apply(session: AsyncSession, user: User, payload: Any) -> Seller:
    """Create a seller profile for the authenticated user, pending verification.

    Applying grants nothing on its own — an admin still has to verify the
    account before any listing can go live (§5.5).
    """
    existing = await session.scalar(select(Seller.id).where(Seller.user_id == user.id))
    if existing is not None:
        raise ConflictError("Sizda sotuvchi hisobi allaqachon bor.", code="SELLER_ALREADY_EXISTS")

    base = catalog_service.slugify(payload.business_name)
    slug = base
    suffix = 2
    while await session.scalar(select(Seller.id).where(Seller.slug == slug)) is not None:
        slug = f"{base}-{suffix}"
        suffix += 1

    seller = Seller(
        user_id=user.id,
        business_name=payload.business_name.strip(),
        slug=slug,
        description=payload.description,
        country=payload.country.upper(),
        contact_email=payload.contact_email,
        license_number=payload.license_number,
        tax_id=payload.tax_id,
        certification_documents=payload.certification_documents,
        status=SellerStatus.PENDING,
    )
    session.add(seller)
    if user.role == UserRole.BUYER:
        user.role = UserRole.SELLER
    await session.flush()
    return seller


async def update_profile(session: AsyncSession, seller: Seller, payload: Any) -> Seller:
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(seller, field, value)
    await session.flush()
    return seller


async def get_public_profile(session: AsyncSession, slug: str) -> tuple[Seller, int]:
    seller = (await session.execute(select(Seller).where(Seller.slug == slug))).scalar_one_or_none()
    # Unverified sellers have no storefront presence at all.
    if seller is None or seller.status != SellerStatus.VERIFIED:
        raise NotFoundError("Bunday sotuvchi mavjud emas.")
    count = await session.scalar(
        select(func.count(Product.id)).where(
            Product.seller_id == seller.id, Product.status == ProductStatus.ACTIVE
        )
    )
    return seller, int(count or 0)


async def dashboard_stats(session: AsyncSession, seller: Seller) -> dict[str, Any]:
    """Counts and money for the seller's own dashboard. Scoped to their rows."""
    since = datetime.now(UTC) - timedelta(days=30)

    async def _count(*where: Any) -> int:
        return int(await session.scalar(select(func.count(Product.id)).where(*where)) or 0)

    active = await _count(Product.seller_id == seller.id, Product.status == ProductStatus.ACTIVE)
    drafts = await _count(Product.seller_id == seller.id, Product.status == ProductStatus.DRAFT)
    out_of_stock = await _count(
        Product.seller_id == seller.id,
        Product.status == ProductStatus.ACTIVE,
        Product.stock == 0,
    )
    low_stock = await _count(
        Product.seller_id == seller.id,
        Product.status == ProductStatus.ACTIVE,
        Product.stock > 0,
        Product.stock <= LOW_STOCK_THRESHOLD,
    )

    open_statuses = (ShipmentStatus.PAID, ShipmentStatus.PROCESSING)
    open_shipments = int(
        await session.scalar(
            select(func.count(Shipment.id)).where(
                Shipment.seller_id == seller.id, Shipment.status.in_(open_statuses)
            )
        )
        or 0
    )
    shipped_30d = int(
        await session.scalar(
            select(func.count(Shipment.id)).where(
                Shipment.seller_id == seller.id,
                Shipment.status.in_((ShipmentStatus.SHIPPED, ShipmentStatus.DELIVERED)),
                Shipment.created_at >= since,
            )
        )
        or 0
    )

    earned_statuses = (
        ShipmentStatus.PAID,
        ShipmentStatus.PROCESSING,
        ShipmentStatus.SHIPPED,
        ShipmentStatus.DELIVERED,
    )
    rows = list(
        (
            await session.execute(
                select(Shipment).where(
                    Shipment.seller_id == seller.id, Shipment.status.in_(earned_statuses)
                )
            )
        ).scalars()
    )
    revenue_30d = sum(s.seller_payout_amount_minor for s in rows if s.created_at >= since)
    pending_payout = sum(
        s.seller_payout_amount_minor
        for s in rows
        if s.status in (ShipmentStatus.PAID, ShipmentStatus.PROCESSING, ShipmentStatus.SHIPPED)
    )
    currency = rows[0].currency if rows else DEFAULT_CURRENCY

    return {
        "active_listings": active,
        "draft_listings": drafts,
        "out_of_stock": out_of_stock,
        "low_stock": low_stock,
        "open_shipments": open_shipments,
        "shipped_last_30d": shipped_30d,
        "revenue_last_30d_minor": revenue_30d,
        "pending_payout_minor": pending_payout,
        "currency": currency,
    }


async def payout_status(seller: Seller) -> dict[str, Any]:
    """Ask the payment port about payouts.

    While CLAUDE.md §4 is open this is always the fake provider — real payout
    scheduling and who holds funds in transit are deferred sub-questions there.
    """
    provider = get_payment_provider()
    status = await provider.get_seller_payout_status(seller.id)
    return {
        "payouts_enabled": status.payouts_enabled,
        "on_hold": status.on_hold,
        "requirements_outstanding": list(status.requirements_outstanding),
        "provider": getattr(provider, "name", "unknown"),
    }


async def set_verification(
    session: AsyncSession,
    *,
    seller_id: str,
    status: str,
    reason: str | None,
    admin_id: str,
    ip_address: str | None = None,
) -> Seller:
    """Admin action: verify, reject, or suspend a seller. Always audited (§12.3)."""
    seller = await session.get(Seller, seller_id)
    if seller is None:
        raise NotFoundError("Bunday sotuvchi mavjud emas.")
    if status == SellerStatus.REJECTED and not reason:
        raise ValidationError(
            "Rad etish uchun sotuvchi tushunadigan sabab kerak.", details={"field": "reason"}
        )

    seller.status = status
    seller.rejection_reason = reason if status != SellerStatus.VERIFIED else None

    if status != SellerStatus.VERIFIED:
        # Nothing from a suspended or rejected seller stays on the storefront.
        products = list(
            (
                await session.execute(
                    select(Product).where(
                        Product.seller_id == seller.id, Product.status == ProductStatus.ACTIVE
                    )
                )
            ).scalars()
        )
        for product in products:
            product.status = ProductStatus.DRAFT

    await audit_service.record(
        session,
        actor_id=admin_id,
        actor_role=UserRole.ADMIN,
        action=audit_service.SELLER_VERIFICATION_CHANGED,
        subject_type="seller",
        subject_id=seller.id,
        ip_address=ip_address,
        metadata={"status": status},
    )
    await outbox_service.emit(
        session,
        outbox_service.SELLER_VERIFICATION_CHANGED,
        {"seller_id": seller.id, "status": status},
    )
    await session.flush()
    return seller
