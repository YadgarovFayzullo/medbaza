"""Competing checkouts must never oversell (CLAUDE.md §5.3).

This test cannot use the rolled-back session fixture: it needs genuinely
concurrent transactions, so it commits its own rows and cleans them up.
"""

import asyncio
import uuid
from typing import Any

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.security import hash_password
from app.db.session import get_db
from app.main import app
from app.models.cart import Cart, CartItem
from app.models.category import Category
from app.models.enums import SellerStatus, UserRole
from app.models.infra import IdempotencyKey, OutboxEvent
from app.models.order import Order, OrderEvent, OrderItem, Shipment
from app.models.product import Product
from app.models.seller import Seller
from app.models.user import User

ADDRESS = {
    "recipient_name": "Rosa Lindqvist",
    "line1": "118 Harborview Road",
    "city": "Portland",
    "postal_code": "97205",
    "country": "US",
}

STOCK = 5
BUYERS = 8


@pytest_asyncio.fixture
async def committed(engine: Any):
    """Committed fixture rows plus a client that opens a fresh session per request."""
    maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with maker() as setup:
        category = Category(name="Concurrency", slug="concurrency-test")
        owner = User(
            email="race.seller@example.com",
            hashed_password=hash_password("correct-horse-battery"),
            full_name="Race Seller",
            role=UserRole.SELLER,
        )
        setup.add_all([category, owner])
        await setup.flush()
        seller = Seller(
            user_id=owner.id,
            business_name="Race Medical",
            slug="race-medical",
            country="US",
            contact_email="race.seller@example.com",
            status=SellerStatus.VERIFIED,
        )
        setup.add(seller)
        await setup.flush()
        product = Product(
            seller_id=seller.id,
            category_id=category.id,
            name="Contested oximeter",
            slug="contested-oximeter",
            sku="RACE-1",
            price_amount_minor=5000,
            currency="USD",
            stock=STOCK,
            status="active",
        )
        setup.add(product)
        buyers = [
            User(
                email=f"racer{index}@example.com",
                hashed_password=hash_password("correct-horse-battery"),
                full_name=f"Racer {index}",
                role=UserRole.BUYER,
            )
            for index in range(BUYERS)
        ]
        setup.add_all(buyers)
        await setup.commit()
        product_id = product.id
        buyer_ids = [buyer.id for buyer in buyers]

    async def _get_db():
        async with maker() as request_session:
            yield request_session

    app.dependency_overrides[get_db] = _get_db
    yield maker, product_id, buyer_ids
    app.dependency_overrides.clear()

    async with maker() as cleanup:
        shipment_ids = (
            (
                await cleanup.execute(
                    select(Shipment.id)
                    .join(Order, Order.id == Shipment.order_id)
                    .where(Order.buyer_id.in_(buyer_ids))
                )
            )
            .scalars()
            .all()
        )
        order_ids = (
            (await cleanup.execute(select(Order.id).where(Order.buyer_id.in_(buyer_ids))))
            .scalars()
            .all()
        )
        cart_ids = (
            (await cleanup.execute(select(Cart.id).where(Cart.user_id.in_(buyer_ids))))
            .scalars()
            .all()
        )
        await cleanup.execute(
            delete(OrderItem).where(OrderItem.shipment_id.in_(shipment_ids or [""]))
        )
        await cleanup.execute(delete(OrderEvent).where(OrderEvent.order_id.in_(order_ids or [""])))
        await cleanup.execute(delete(Shipment).where(Shipment.id.in_(shipment_ids or [""])))
        await cleanup.execute(delete(Order).where(Order.id.in_(order_ids or [""])))
        await cleanup.execute(delete(CartItem).where(CartItem.cart_id.in_(cart_ids or [""])))
        await cleanup.execute(delete(Cart).where(Cart.id.in_(cart_ids or [""])))
        await cleanup.execute(delete(IdempotencyKey))
        await cleanup.execute(delete(OutboxEvent))
        await cleanup.execute(delete(Product).where(Product.slug == "contested-oximeter"))
        await cleanup.execute(delete(Seller).where(Seller.slug == "race-medical"))
        await cleanup.execute(delete(User).where(User.id.in_([*buyer_ids])))
        await cleanup.execute(delete(User).where(User.email == "race.seller@example.com"))
        await cleanup.execute(delete(Category).where(Category.slug == "concurrency-test"))
        await cleanup.commit()


async def test_competing_checkouts_never_oversell(committed) -> None:
    maker, product_id, buyer_ids = committed
    from app.services.auth_service import issue_tokens

    async def _headers(buyer_id: str) -> dict[str, str]:
        async with maker() as read:
            buyer = await read.get(User, buyer_id)
            access, _, _ = issue_tokens(buyer)
        return {"Authorization": f"Bearer {access}"}

    async def _buy(buyer_id: str) -> int:
        headers = await _headers(buyer_id)
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test/api/v1"
        ) as http:
            await http.post(
                "/cart/items", json={"product_id": product_id, "quantity": 1}, headers=headers
            )
            response = await http.post(
                "/checkout",
                json={"shipping_address": ADDRESS},
                headers={**headers, "Idempotency-Key": uuid.uuid4().hex},
            )
            return response.status_code

    statuses = await asyncio.gather(*(_buy(buyer_id) for buyer_id in buyer_ids))
    succeeded = [status for status in statuses if status == 201]
    refused = [status for status in statuses if status == 409]

    assert len(succeeded) == STOCK
    assert len(refused) == BUYERS - STOCK

    async with maker() as check:
        product = await check.get(Product, product_id)
        assert product.stock == 0
        # The CHECK constraint is the real guarantee; it must never have been hit.
        assert product.stock >= 0
