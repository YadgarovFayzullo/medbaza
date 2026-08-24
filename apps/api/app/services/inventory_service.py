"""Stock movement. Every mutation goes through the row lock below.

Overselling is a correctness bug, not a business inconvenience (CLAUDE.md
§5.3). `Product.stock` carries a `CHECK (stock >= 0)` constraint — that is the
real guarantee; the checks here exist to produce a good error message before
the database has to reject the write.
"""

from collections.abc import Mapping

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import InsufficientStockError, NotFoundError
from app.models.product import Product


async def lock_products(session: AsyncSession, product_ids: list[str]) -> dict[str, Product]:
    """Select the given products `FOR UPDATE`, **ordered by product id**.

    Consistent lock ordering is what prevents two concurrent checkouts touching
    the same pair of products from deadlocking each other.
    """
    if not product_ids:
        return {}
    stmt = (
        select(Product)
        .where(Product.id.in_(sorted(set(product_ids))))
        .order_by(Product.id)
        .with_for_update()
        # The product is usually already in the identity map from loading the
        # cart. Without this the lock is taken but the *stale* stock value is
        # returned, and two concurrent checkouts both decrement from it.
        .execution_options(populate_existing=True)
    )
    rows = list((await session.execute(stmt)).scalars())
    return {product.id: product for product in rows}


async def commit_stock(session: AsyncSession, quantities: Mapping[str, int]) -> dict[str, Product]:
    """Lock, verify, then decrement — never read in one statement and write in
    a later unlocked one.

    Must be called inside an existing transaction; the caller commits.
    """
    locked = await lock_products(session, list(quantities))

    for product_id, quantity in sorted(quantities.items()):
        product = locked.get(product_id)
        if product is None:
            raise NotFoundError(
                "Mahsulotlardan biri endi mavjud emas.",
                details={"product_id": product_id},
            )
        if product.stock < quantity:
            raise InsufficientStockError(
                f"“{product.name}” dan atigi {product.stock} ta qoldi.",
                details={"product_id": product_id, "available": product.stock},
            )

    for product_id, quantity in sorted(quantities.items()):
        locked[product_id].stock -= quantity

    await session.flush()
    return locked


async def release_stock(session: AsyncSession, quantities: Mapping[str, int]) -> None:
    """Return stock to the catalog — used by the cancellation path only (§5.4).

    Never call this to "fix up" a failed decrement: cancellation is the single
    route back, so every release is accounted for by an order event.
    """
    locked = await lock_products(session, list(quantities))
    for product_id, quantity in sorted(quantities.items()):
        product = locked.get(product_id)
        if product is not None:
            product.stock += quantity
    await session.flush()


async def set_stock(session: AsyncSession, seller_id: str, product_id: str, stock: int) -> Product:
    """Seller-initiated inventory correction. Ownership is enforced here."""
    locked = await lock_products(session, [product_id])
    product = locked.get(product_id)
    if product is None or product.seller_id != seller_id:
        raise NotFoundError("Bunday e’lon mavjud emas.")
    if stock < 0:
        raise InsufficientStockError("Qoldiq manfiy bo‘lishi mumkin emas.")
    product.stock = stock
    await session.flush()
    return product
