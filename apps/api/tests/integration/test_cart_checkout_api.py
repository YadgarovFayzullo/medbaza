"""Cart and checkout: totals, multi-seller split, stock, and idempotency."""

import uuid

from httpx import AsyncClient

from app.models.enums import ShipmentStatus
from app.services.pricing_service import SHIPPING_FLAT_MINOR

ADDRESS = {
    "recipient_name": "Rosa Lindqvist",
    "line1": "118 Harborview Road",
    "city": "Portland",
    "region": "OR",
    "postal_code": "97205",
    "country": "US",
}


def _key() -> dict[str, str]:
    return {"Idempotency-Key": uuid.uuid4().hex}


async def test_a_guest_cart_survives_across_requests(client: AsyncClient, make_product) -> None:
    product = await make_product(price_amount_minor=2500, stock=5)

    created = await client.post("/cart/items", json={"product_id": product.id, "quantity": 2})
    assert created.status_code == 201
    token = created.headers["X-Cart-Token"]
    body = created.json()
    assert body["item_count"] == 2
    assert body["items_amount_minor"] == 5000

    fetched = (await client.get("/cart", headers={"X-Cart-Token": token})).json()
    assert fetched["id"] == body["id"]
    assert fetched["item_count"] == 2


async def test_cart_totals_are_grouped_per_seller(
    client: AsyncClient, make_product, make_seller
) -> None:
    first = await make_seller(business_name="Alpha Medical")
    second = await make_seller(business_name="Beta Medical")
    a = await make_product(seller=first, name="Alpha item", sku="A", price_amount_minor=3000)
    b = await make_product(seller=second, name="Beta item", sku="B", price_amount_minor=4000)

    created = await client.post("/cart/items", json={"product_id": a.id, "quantity": 1})
    token = {"X-Cart-Token": created.headers["X-Cart-Token"]}
    body = (
        await client.post("/cart/items", json={"product_id": b.id, "quantity": 1}, headers=token)
    ).json()
    assert len(body["groups"]) == 2
    # Two sellers means two shipping lines, because each ships separately.
    assert body["shipping_amount_minor"] == SHIPPING_FLAT_MINOR * 2
    assert body["total_amount_minor"] == 7000 + SHIPPING_FLAT_MINOR * 2


async def test_adding_more_than_stock_is_refused_with_a_useful_code(
    client: AsyncClient, make_product
) -> None:
    product = await make_product(stock=2)
    response = await client.post("/cart/items", json={"product_id": product.id, "quantity": 3})
    assert response.status_code == 409
    error = response.json()["error"]
    assert error["code"] == "INSUFFICIENT_STOCK"
    assert error["details"]["available"] == 2


async def test_checkout_creates_one_shipment_per_seller_and_commits_stock(
    client: AsyncClient, session, make_product, make_seller, make_user, auth_headers
) -> None:
    buyer = await make_user(email="checkout.buyer@example.com")
    first = await make_seller(business_name="Alpha Medical")
    second = await make_seller(business_name="Beta Medical")
    a = await make_product(
        seller=first, name="Alpha item", sku="A", price_amount_minor=3000, stock=10
    )
    b = await make_product(
        seller=second, name="Beta item", sku="B", price_amount_minor=4000, stock=4
    )

    headers = await auth_headers(buyer)
    await client.post("/cart/items", json={"product_id": a.id, "quantity": 2}, headers=headers)
    await client.post("/cart/items", json={"product_id": b.id, "quantity": 1}, headers=headers)

    response = await client.post(
        "/checkout", json={"shipping_address": ADDRESS}, headers={**headers, **_key()}
    )
    assert response.status_code == 201
    order = response.json()["order"]
    assert len(order["shipments"]) == 2
    assert order["items_amount_minor"] == 3000 * 2 + 4000
    assert order["status"] == ShipmentStatus.PENDING_PAYMENT
    assert response.json()["payment_redirect_url"].startswith("http")

    await session.refresh(a)
    await session.refresh(b)
    assert a.stock == 8
    assert b.stock == 3

    # The cart is emptied by a successful checkout.
    assert (await client.get("/cart", headers=headers)).json()["item_count"] == 0


async def test_a_repeated_idempotency_key_returns_the_first_order(
    client: AsyncClient, make_product, make_user, auth_headers
) -> None:
    buyer = await make_user(email="idempotent@example.com")
    product = await make_product(stock=10)
    headers = await auth_headers(buyer)
    await client.post(
        "/cart/items", json={"product_id": product.id, "quantity": 1}, headers=headers
    )

    key = _key()
    first = await client.post(
        "/checkout", json={"shipping_address": ADDRESS}, headers={**headers, **key}
    )
    second = await client.post(
        "/checkout", json={"shipping_address": ADDRESS}, headers={**headers, **key}
    )
    assert first.status_code == 201
    assert second.json()["order"]["id"] == first.json()["order"]["id"]


async def test_the_same_key_with_a_different_body_is_rejected(
    client: AsyncClient, make_product, make_user, auth_headers
) -> None:
    buyer = await make_user(email="idempotent2@example.com")
    product = await make_product(stock=10)
    headers = await auth_headers(buyer)
    await client.post(
        "/cart/items", json={"product_id": product.id, "quantity": 1}, headers=headers
    )

    key = _key()
    await client.post("/checkout", json={"shipping_address": ADDRESS}, headers={**headers, **key})
    response = await client.post(
        "/checkout",
        json={"shipping_address": {**ADDRESS, "city": "Seattle"}},
        headers={**headers, **key},
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "IDEMPOTENCY_KEY_REUSED"


async def test_checkout_requires_an_idempotency_key(
    client: AsyncClient, make_product, make_user, auth_headers
) -> None:
    buyer = await make_user(email="nokey@example.com")
    product = await make_product(stock=3)
    headers = await auth_headers(buyer)
    await client.post(
        "/cart/items", json={"product_id": product.id, "quantity": 1}, headers=headers
    )

    response = await client.post("/checkout", json={"shipping_address": ADDRESS}, headers=headers)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "IDEMPOTENCY_KEY_REQUIRED"


async def test_guest_checkout_needs_an_email(client: AsyncClient, make_product) -> None:
    product = await make_product(stock=3)
    created = await client.post("/cart/items", json={"product_id": product.id, "quantity": 1})
    token = {"X-Cart-Token": created.headers["X-Cart-Token"]}

    missing = await client.post(
        "/checkout", json={"shipping_address": ADDRESS}, headers={**token, **_key()}
    )
    assert missing.status_code == 422
    assert missing.json()["error"]["code"] == "VALIDATION_ERROR"

    ok = await client.post(
        "/checkout",
        json={"shipping_address": ADDRESS, "email": "guest@example.com"},
        headers={**token, **_key()},
    )
    assert ok.status_code == 201

    number = ok.json()["order"]["number"]
    found = await client.get(
        "/orders/lookup", params={"number": number, "email": "guest@example.com"}
    )
    assert found.status_code == 200
    # The order number alone is not enough to see a guest order.
    assert (
        await client.get("/orders/lookup", params={"number": number, "email": "other@example.com"})
    ).status_code == 404


async def test_checkout_of_an_empty_cart_is_refused(
    client: AsyncClient, make_user, auth_headers
) -> None:
    buyer = await make_user(email="empty@example.com")
    response = await client.post(
        "/checkout",
        json={"shipping_address": ADDRESS},
        headers={**await auth_headers(buyer), **_key()},
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "EMPTY_CART"


async def test_cancelling_before_dispatch_restores_stock(
    client: AsyncClient, session, make_product, make_user, auth_headers
) -> None:
    buyer = await make_user(email="canceller@example.com")
    product = await make_product(stock=5)
    headers = await auth_headers(buyer)
    await client.post(
        "/cart/items", json={"product_id": product.id, "quantity": 2}, headers=headers
    )
    order = (
        await client.post(
            "/checkout", json={"shipping_address": ADDRESS}, headers={**headers, **_key()}
        )
    ).json()["order"]

    await session.refresh(product)
    assert product.stock == 3

    cancelled = await client.post(
        f"/orders/{order['id']}/cancel", json={"reason": "Ordered by mistake"}, headers=headers
    )
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    await session.refresh(product)
    assert product.stock == 5
    # Every transition is recorded, so the history explains the restock.
    assert any(e["to_status"] == "cancelled" for e in cancelled.json()["events"])
