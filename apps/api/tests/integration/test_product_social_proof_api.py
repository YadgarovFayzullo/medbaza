"""The storefront's "bought recently" figure, which is derived, never stored."""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.models.enums import ShipmentStatus
from app.models.order import Order, OrderItem, Shipment


@pytest.fixture
def buy(session):
    """Record a purchase of `product` by `buyer`, at a chosen age and state."""

    async def _buy(
        product,
        buyer,
        *,
        status: str = ShipmentStatus.PAID,
        days_ago: int = 0,
    ) -> None:
        order = Order(
            number=f"MB-{uuid4().hex[:10].upper()}",
            buyer_id=buyer.id,
            currency=product.currency,
            items_amount_minor=product.price_amount_minor,
            shipping_amount_minor=0,
            total_amount_minor=product.price_amount_minor,
            ship_recipient_name="Test Buyer",
            ship_line1="1 Clinic Street",
            ship_city="Tashkent",
            ship_postal_code="100000",
            ship_country="UZ",
        )
        session.add(order)
        await session.flush()

        shipment = Shipment(
            order_id=order.id,
            seller_id=product.seller_id,
            status=status,
            currency=product.currency,
            items_amount_minor=product.price_amount_minor,
            shipping_amount_minor=0,
            platform_fee_amount_minor=0,
        )
        session.add(shipment)
        await session.flush()

        item = OrderItem(
            shipment_id=shipment.id,
            product_id=product.id,
            seller_id=product.seller_id,
            product_name=product.name,
            product_slug=product.slug,
            sku=product.sku,
            quantity=1,
            unit_amount_minor=product.price_amount_minor,
            currency=product.currency,
        )
        session.add(item)
        await session.flush()
        # created_at is server-defaulted, so age is set after the insert.
        item.created_at = datetime.now(UTC) - timedelta(days=days_ago)
        await session.commit()

    return _buy


async def _read(client: AsyncClient, slug: str) -> int:
    response = await client.get(f"/products/{slug}")
    assert response.status_code == 200
    return response.json()["buyers_last_7d"]


async def test_a_listing_nobody_bought_reports_zero(client: AsyncClient, make_product) -> None:
    product = await make_product()
    # Zero is a real answer — the field is never absent and never invented.
    assert await _read(client, product.slug) == 0


async def test_each_buyer_counts_once_however_many_orders(
    client: AsyncClient, make_product, make_user, buy
) -> None:
    product = await make_product()
    buyer = await make_user(email="repeat@example.com")
    await buy(product, buyer)
    await buy(product, buyer)

    # The line says how many *people* bought, not how many orders were placed.
    assert await _read(client, product.slug) == 1


async def test_separate_buyers_add_up(client: AsyncClient, make_product, make_user, buy) -> None:
    product = await make_product()
    await buy(product, await make_user(email="one@example.com"))
    await buy(product, await make_user(email="two@example.com"))

    assert await _read(client, product.slug) == 2


async def test_a_purchase_older_than_the_window_drops_out(
    client: AsyncClient, make_product, make_user, buy
) -> None:
    product = await make_product()
    await buy(product, await make_user(email="old@example.com"), days_ago=8)

    assert await _read(client, product.slug) == 0


@pytest.mark.parametrize("status", [ShipmentStatus.PENDING_PAYMENT, ShipmentStatus.PAYMENT_FAILED])
async def test_a_basket_that_never_settled_is_not_a_purchase(
    client: AsyncClient, make_product, make_user, buy, status: str
) -> None:
    product = await make_product()
    await buy(product, await make_user(email="unpaid@example.com"), status=status)

    assert await _read(client, product.slug) == 0
