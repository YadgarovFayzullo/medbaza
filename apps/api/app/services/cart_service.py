"""The buyer's basket.

Adding to a cart never reserves stock (CLAUDE.md §5.3) — stock is committed at
order creation. The server is authoritative on price and availability; the
cart view reports both so an optimistic client can reconcile.
"""

import secrets
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import InsufficientStockError, NotFoundError, ValidationError
from app.core.money import DEFAULT_CURRENCY
from app.models.cart import Cart, CartItem
from app.models.enums import ProductStatus
from app.models.product import Product
from app.services import pricing_service

MAX_LINE_QUANTITY = 999


def new_session_token() -> str:
    return secrets.token_urlsafe(32)


async def _load(session: AsyncSession, cart_id: str) -> Cart:
    result = await session.execute(
        select(Cart)
        .where(Cart.id == cart_id)
        .options(
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.seller)
        )
        # The cart is usually already in the identity map with a stale item
        # collection; without this the just-added line would not appear.
        .execution_options(populate_existing=True)
    )
    cart = result.scalar_one_or_none()
    if cart is None:
        raise NotFoundError("Savat topilmadi.")
    return cart


async def _create(session: AsyncSession, cart: Cart) -> Cart:
    session.add(cart)
    await session.flush()
    return await _load(session, cart.id)


async def get_or_create_cart(
    session: AsyncSession, *, user_id: str | None, session_token: str | None
) -> Cart:
    """Resolve the caller's cart, creating one if this is their first item.

    A guest cart is keyed by an opaque token; on login it is merged into the
    user's cart by `claim_guest_cart`.
    """
    stmt = select(Cart).options(
        selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.seller)
    )
    if user_id:
        cart = (await session.execute(stmt.where(Cart.user_id == user_id))).scalar_one_or_none()
        if cart is None:
            cart = Cart(user_id=user_id)
            # A freshly flushed row has no loaded collection; reload so callers
            # can read `cart.items` without triggering a lazy load.
            cart = await _create(session, cart)
        return cart

    if session_token:
        cart = (
            await session.execute(stmt.where(Cart.session_token == session_token))
        ).scalar_one_or_none()
        if cart is not None:
            return cart

    return await _create(session, Cart(session_token=session_token or new_session_token()))


async def claim_guest_cart(session: AsyncSession, *, user_id: str, session_token: str) -> Cart:
    """Merge a guest cart into the signed-in user's cart on login."""
    guest = (
        await session.execute(
            select(Cart)
            .where(Cart.session_token == session_token, Cart.user_id.is_(None))
            .options(selectinload(Cart.items))
        )
    ).scalar_one_or_none()
    user_cart = await get_or_create_cart(session, user_id=user_id, session_token=None)
    if guest is None or guest.id == user_cart.id:
        return user_cart

    existing = {item.product_id: item for item in user_cart.items}
    for item in list(guest.items):
        if item.product_id in existing:
            merged = existing[item.product_id].quantity + item.quantity
            existing[item.product_id].quantity = min(merged, MAX_LINE_QUANTITY)
        else:
            session.add(
                CartItem(cart_id=user_cart.id, product_id=item.product_id, quantity=item.quantity)
            )
    await session.delete(guest)
    await session.flush()
    return await _load(session, user_cart.id)


async def _purchasable(session: AsyncSession, product_id: str) -> Product:
    result = await session.execute(
        select(Product).where(Product.id == product_id).options(selectinload(Product.seller))
    )
    product = result.scalar_one_or_none()
    if product is None or product.status != ProductStatus.ACTIVE or product.archived_at:
        raise NotFoundError("Bu mahsulot mavjud emas.")
    return product


async def add_item(session: AsyncSession, cart: Cart, *, product_id: str, quantity: int) -> Cart:
    product = await _purchasable(session, product_id)
    existing = next((i for i in cart.items if i.product_id == product_id), None)
    wanted = (existing.quantity if existing else 0) + quantity
    if wanted > MAX_LINE_QUANTITY:
        raise ValidationError(f"Bitta qatorda ko‘pi bilan {MAX_LINE_QUANTITY} dona.")
    # A soft check for a good message — stock is only truly committed at checkout.
    if product.stock < wanted:
        raise InsufficientStockError(
            f"“{product.name}” dan atigi {product.stock} ta qoldi.",
            details={"product_id": product_id, "available": product.stock},
        )

    if existing is not None:
        existing.quantity = wanted
    else:
        session.add(CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity))
    await session.flush()
    return await _load(session, cart.id)


async def set_quantity(session: AsyncSession, cart: Cart, *, item_id: str, quantity: int) -> Cart:
    item = next((i for i in cart.items if i.id == item_id), None)
    if item is None:
        raise NotFoundError("Bu mahsulot savatingizda yo‘q.")
    if quantity == 0:
        await session.delete(item)
    else:
        product = await _purchasable(session, item.product_id)
        if product.stock < quantity:
            raise InsufficientStockError(
                f"“{product.name}” dan atigi {product.stock} ta qoldi.",
                details={"product_id": product.id, "available": product.stock},
            )
        item.quantity = quantity
    await session.flush()
    return await _load(session, cart.id)


async def remove_item(session: AsyncSession, cart: Cart, *, item_id: str) -> Cart:
    return await set_quantity(session, cart, item_id=item_id, quantity=0)


async def clear(session: AsyncSession, cart: Cart) -> Cart:
    for item in list(cart.items):
        await session.delete(item)
    await session.flush()
    return await _load(session, cart.id)


def group_by_seller(cart: Cart) -> list[tuple[Any, list[CartItem]]]:
    """Items grouped exactly the way checkout will split them into shipments."""
    groups: dict[str, list[CartItem]] = {}
    sellers: dict[str, Any] = {}
    for item in sorted(cart.items, key=lambda i: (i.product.seller_id, i.id)):
        groups.setdefault(item.product.seller_id, []).append(item)
        sellers[item.product.seller_id] = item.product.seller
    return [(sellers[sid], groups[sid]) for sid in sorted(groups)]


def summarise(cart: Cart) -> dict[str, Any]:
    """Server-computed totals. The client never supplies a price (§5.2)."""
    groups = group_by_seller(cart)
    warnings: list[str] = []
    currencies = {item.product.currency for item in cart.items}
    currency = (
        next(iter(currencies))
        if len(currencies) == 1
        else (next(iter(sorted(currencies))) if currencies else DEFAULT_CURRENCY)
    )
    if len(currencies) > 1:
        warnings.append(
            "Items in this cart settle in different currencies and cannot be bought together."
        )

    items_total = 0
    shipping_total = 0
    group_views: list[dict[str, Any]] = []
    for seller, items in groups:
        subtotal = sum(i.product.price_amount_minor * i.quantity for i in items)
        items_total += subtotal
        shipping_total += pricing_service.shipping_for_group(subtotal)
        for item in items:
            if item.product.stock < item.quantity:
                warnings.append(
                    f"“{item.product.name}” now has only {item.product.stock} in stock."
                )
        group_views.append({"seller": seller, "items": items, "subtotal_amount_minor": subtotal})

    return {
        "currency": currency,
        "groups": group_views,
        "item_count": sum(i.quantity for i in cart.items),
        "items_amount_minor": items_total,
        "shipping_amount_minor": shipping_total,
        "total_amount_minor": items_total + shipping_total,
        "prescription_required": any(i.product.prescription_required for i in cart.items),
        "warnings": warnings,
        "currencies": currencies,
    }
