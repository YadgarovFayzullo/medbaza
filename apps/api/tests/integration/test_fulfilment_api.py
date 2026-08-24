"""Seller fulfilment and the payment webhook path."""

import json
import uuid

from httpx import AsyncClient

from app.models.enums import ShipmentStatus, UserRole
from app.models.user import User
from app.services.payments.adapters.fake import sign_webhook
from app.services.pricing_service import SHIPPING_FLAT_MINOR

ADDRESS = {
    "recipient_name": "Rosa Lindqvist",
    "line1": "118 Harborview Road",
    "city": "Portland",
    "postal_code": "97205",
    "country": "US",
}


async def _place_order(client: AsyncClient, buyer, headers, product, quantity: int = 1) -> dict:
    await client.post(
        "/cart/items", json={"product_id": product.id, "quantity": quantity}, headers=headers
    )
    response = await client.post(
        "/checkout",
        json={"shipping_address": ADDRESS},
        headers={**headers, "Idempotency-Key": uuid.uuid4().hex},
    )
    assert response.status_code == 201, response.text
    return response.json()["order"]


def _webhook(payment_ref: str, event_type: str, amount_minor: int, event_id: str) -> tuple:
    body = json.dumps(
        {
            "id": event_id,
            "type": event_type,
            "payment_ref": payment_ref,
            "amount_minor": amount_minor,
            "currency": "USD",
        }
    ).encode()
    return body, sign_webhook(body)


async def test_payment_webhook_moves_shipments_to_paid(
    client: AsyncClient, session, make_product, make_user, auth_headers
) -> None:
    from app.models.order import Order

    buyer = await make_user(email="fulfil.buyer@example.com")
    product = await make_product(stock=10, price_amount_minor=12_000)
    headers = await auth_headers(buyer)
    order = await _place_order(client, buyer, headers, product)

    stored = await session.get(Order, order["id"])
    await session.refresh(stored)
    body, signature = _webhook(
        stored.payment_ref, "payment.succeeded", order["total_amount_minor"], "evt_paid_1"
    )
    response = await client.post("/payments/webhook", content=body, headers=signature)
    assert response.status_code == 200

    refreshed = (await client.get(f"/orders/{order['id']}", headers=headers)).json()
    assert {s["status"] for s in refreshed["shipments"]} == {ShipmentStatus.PAID}


async def test_a_duplicate_webhook_is_a_no_op(
    client: AsyncClient, session, make_product, make_user, auth_headers
) -> None:
    from app.models.order import Order

    buyer = await make_user(email="dupe.buyer@example.com")
    product = await make_product(stock=10, price_amount_minor=12_000)
    headers = await auth_headers(buyer)
    order = await _place_order(client, buyer, headers, product)
    stored = await session.get(Order, order["id"])
    await session.refresh(stored)

    body, signature = _webhook(
        stored.payment_ref, "payment.succeeded", order["total_amount_minor"], "evt_dupe"
    )
    first = await client.post("/payments/webhook", content=body, headers=signature)
    second = await client.post("/payments/webhook", content=body, headers=signature)
    assert first.status_code == second.status_code == 200

    refreshed = (await client.get(f"/orders/{order['id']}", headers=headers)).json()
    paid_events = [e for e in refreshed["events"] if e["to_status"] == ShipmentStatus.PAID]
    # Recorded once, not twice: the unique provider event ID is the guard.
    assert len(paid_events) == len(refreshed["shipments"])


async def test_a_webhook_amount_that_does_not_match_is_refused(
    client: AsyncClient, session, make_product, make_user, auth_headers
) -> None:
    from app.models.order import Order

    buyer = await make_user(email="mismatch.buyer@example.com")
    product = await make_product(stock=10, price_amount_minor=12_000)
    headers = await auth_headers(buyer)
    order = await _place_order(client, buyer, headers, product)
    stored = await session.get(Order, order["id"])
    await session.refresh(stored)

    body, signature = _webhook(stored.payment_ref, "payment.succeeded", 1, "evt_mismatch")
    response = await client.post("/payments/webhook", content=body, headers=signature)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "PAYMENT_AMOUNT_MISMATCH"


async def test_an_unsigned_webhook_is_rejected(client: AsyncClient) -> None:
    response = await client.post("/payments/webhook", content=b"{}")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_WEBHOOK_SIGNATURE"


async def test_the_seller_fulfils_only_their_own_shipment(
    client: AsyncClient, session, make_product, make_seller, make_user, auth_headers
) -> None:
    from app.models.order import Order

    buyer = await make_user(email="split.buyer@example.com")
    first = await make_seller(business_name="Alpha Medical")
    second = await make_seller(business_name="Beta Medical")
    a = await make_product(
        seller=first, name="Alpha item", sku="A", price_amount_minor=6000, stock=5
    )
    b = await make_product(
        seller=second, name="Beta item", sku="B", price_amount_minor=7000, stock=5
    )

    headers = await auth_headers(buyer)
    await client.post("/cart/items", json={"product_id": a.id, "quantity": 1}, headers=headers)
    await client.post("/cart/items", json={"product_id": b.id, "quantity": 1}, headers=headers)
    order = (
        await client.post(
            "/checkout",
            json={"shipping_address": ADDRESS},
            headers={**headers, "Idempotency-Key": uuid.uuid4().hex},
        )
    ).json()["order"]

    stored = await session.get(Order, order["id"])
    await session.refresh(stored)
    body, signature = _webhook(
        stored.payment_ref, "payment.succeeded", order["total_amount_minor"], "evt_split"
    )
    await client.post("/payments/webhook", content=body, headers=signature)

    alpha_user = await session.get(User, first.user_id)
    alpha_headers = await auth_headers(alpha_user)
    listed = (await client.get("/seller/shipments", headers=alpha_headers)).json()
    assert len(listed["items"]) == 1
    shipment = listed["items"][0]
    # The seller never learns the order total or the other seller's items.
    assert shipment["items_amount_minor"] == 6000
    assert "total_amount_minor" not in shipment
    assert (
        shipment["seller_payout_amount_minor"]
        < shipment["items_amount_minor"] + SHIPPING_FLAT_MINOR
    )

    beta_shipment_id = next(s["id"] for s in order["shipments"] if s["seller_id"] == second.id)
    assert (
        await client.get(f"/seller/shipments/{beta_shipment_id}", headers=alpha_headers)
    ).status_code == 404


async def test_shipping_requires_a_tracking_number_and_records_events(
    client: AsyncClient, session, make_product, make_seller, make_user, auth_headers
) -> None:
    from app.models.order import Order

    buyer = await make_user(email="track.buyer@example.com")
    seller = await make_seller()
    product = await make_product(seller=seller, stock=5, price_amount_minor=9000)
    headers = await auth_headers(buyer)
    order = await _place_order(client, buyer, headers, product)

    stored = await session.get(Order, order["id"])
    await session.refresh(stored)
    body, signature = _webhook(
        stored.payment_ref, "payment.succeeded", order["total_amount_minor"], "evt_track"
    )
    await client.post("/payments/webhook", content=body, headers=signature)

    seller_user = await session.get(User, seller.user_id)
    seller_headers = await auth_headers(seller_user)
    shipment_id = order["shipments"][0]["id"]

    # Illegal jump: paid -> delivered is not in the allowed map.
    illegal = await client.post(
        f"/seller/shipments/{shipment_id}/transition",
        json={"to_status": "delivered"},
        headers=seller_headers,
    )
    assert illegal.status_code == 409
    assert illegal.json()["error"]["code"] == "INVALID_STATE_TRANSITION"

    processing = await client.post(
        f"/seller/shipments/{shipment_id}/transition",
        json={"to_status": "processing"},
        headers=seller_headers,
    )
    assert processing.status_code == 200

    without_tracking = await client.post(
        f"/seller/shipments/{shipment_id}/transition",
        json={"to_status": "shipped"},
        headers=seller_headers,
    )
    assert without_tracking.status_code == 422

    shipped = await client.post(
        f"/seller/shipments/{shipment_id}/transition",
        json={"to_status": "shipped", "carrier": "DHL", "tracking_number": "JD0123456789"},
        headers=seller_headers,
    )
    assert shipped.status_code == 200
    assert shipped.json()["tracking_number"] == "JD0123456789"
    assert [e["to_status"] for e in shipped.json()["events"]][-1] == "shipped"

    # A dispatched shipment is returned, never cancelled (§5.4).
    cancelled = await client.post(
        f"/seller/shipments/{shipment_id}/transition",
        json={"to_status": "cancelled", "reason": "changed mind"},
        headers=seller_headers,
    )
    assert cancelled.status_code == 409


async def test_a_gated_order_cannot_leave_paid_until_approved(
    client: AsyncClient, session, make_product, make_seller, make_user, auth_headers
) -> None:
    from app.models.order import Order

    buyer = await make_user(email="gated.buyer@example.com")
    admin = await make_user(email="gated.admin@example.com", role=UserRole.ADMIN)
    seller = await make_seller()
    product = await make_product(
        seller=seller, name="Insulin pen needles", sku="RX-9", prescription_required=True, stock=5
    )
    headers = await auth_headers(buyer)
    prescription = (
        await client.post(
            "/prescriptions",
            files={"file": ("script.pdf", b"%PDF-1.4", "application/pdf")},
            headers=headers,
        )
    ).json()

    await client.post(
        "/cart/items", json={"product_id": product.id, "quantity": 1}, headers=headers
    )
    order = (
        await client.post(
            "/checkout",
            json={"shipping_address": ADDRESS, "prescription_id": prescription["id"]},
            headers={**headers, "Idempotency-Key": uuid.uuid4().hex},
        )
    ).json()["order"]

    stored = await session.get(Order, order["id"])
    await session.refresh(stored)
    body, signature = _webhook(
        stored.payment_ref, "payment.succeeded", order["total_amount_minor"], "evt_gated"
    )
    await client.post("/payments/webhook", content=body, headers=signature)

    seller_user = await session.get(User, seller.user_id)
    seller_headers = await auth_headers(seller_user)
    shipment_id = order["shipments"][0]["id"]

    blocked = await client.post(
        f"/seller/shipments/{shipment_id}/transition",
        json={"to_status": "processing"},
        headers=seller_headers,
    )
    assert blocked.status_code == 409
    assert blocked.json()["error"]["code"] == "PRESCRIPTION_NOT_APPROVED"

    await client.post(
        f"/admin/prescriptions/{prescription['id']}/review",
        json={"status": "approved"},
        headers=await auth_headers(admin),
    )
    allowed = await client.post(
        f"/seller/shipments/{shipment_id}/transition",
        json={"to_status": "processing"},
        headers=seller_headers,
    )
    assert allowed.status_code == 200
