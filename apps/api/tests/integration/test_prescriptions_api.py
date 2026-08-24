"""Prescription upload, gating, and access control (CLAUDE.md §5.5)."""

import uuid

from httpx import AsyncClient

from app.models.enums import UserRole

ADDRESS = {
    "recipient_name": "Rosa Lindqvist",
    "line1": "118 Harborview Road",
    "city": "Portland",
    "postal_code": "97205",
    "country": "US",
}
PDF = ("script.pdf", b"%PDF-1.4 fake prescription bytes", "application/pdf")


async def test_upload_returns_metadata_only(client: AsyncClient, make_user, auth_headers) -> None:
    buyer = await make_user(email="rx.buyer@example.com")
    response = await client.post(
        "/prescriptions", files={"file": PDF}, headers=await auth_headers(buyer)
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending_review"
    assert body["byte_size"] == len(PDF[1])
    # The document bytes and the storage key never appear in a response body.
    assert "object_key" not in body
    assert "fake prescription" not in response.text


async def test_unsupported_file_types_are_rejected(
    client: AsyncClient, make_user, auth_headers
) -> None:
    buyer = await make_user(email="rx.buyer2@example.com")
    response = await client.post(
        "/prescriptions",
        files={"file": ("script.exe", b"MZ", "application/x-msdownload")},
        headers=await auth_headers(buyer),
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_another_buyer_cannot_see_a_prescription(
    client: AsyncClient, make_user, auth_headers
) -> None:
    owner = await make_user(email="rx.owner@example.com")
    stranger = await make_user(email="rx.stranger@example.com")
    created = (
        await client.post("/prescriptions", files={"file": PDF}, headers=await auth_headers(owner))
    ).json()

    # Not 403: the API does not confirm that someone else's document exists.
    assert (
        await client.get(f"/prescriptions/{created['id']}", headers=await auth_headers(stranger))
    ).status_code == 404


async def test_a_seller_cannot_reach_a_prescription(
    client: AsyncClient, session, make_seller, make_user, auth_headers
) -> None:
    from app.models.user import User

    buyer = await make_user(email="rx.buyer3@example.com")
    seller = await make_seller()
    seller_user = await session.get(User, seller.user_id)
    created = (
        await client.post("/prescriptions", files={"file": PDF}, headers=await auth_headers(buyer))
    ).json()

    response = await client.get(
        f"/prescriptions/{created['id']}", headers=await auth_headers(seller_user)
    )
    assert response.status_code == 404


async def test_download_links_are_short_lived_and_audited(
    client: AsyncClient, session, make_user, auth_headers
) -> None:
    from sqlalchemy import select

    from app.models.infra import AuditLog

    buyer = await make_user(email="rx.buyer4@example.com")
    headers = await auth_headers(buyer)
    created = (await client.post("/prescriptions", files={"file": PDF}, headers=headers)).json()

    link = await client.post(f"/prescriptions/{created['id']}/download-link", headers=headers)
    assert link.status_code == 200
    body = link.json()
    assert 0 < body["expires_in"] <= 300

    entries = (
        await session.execute(select(AuditLog).where(AuditLog.subject_id == created["id"]))
    ).scalars()
    actions = [entry.action for entry in entries]
    assert "prescription.viewed" in actions


async def test_checkout_of_a_gated_cart_demands_a_prescription(
    client: AsyncClient, make_product, make_user, auth_headers
) -> None:
    buyer = await make_user(email="rx.checkout@example.com")
    product = await make_product(name="Salbutamol inhaler", sku="RX-1", prescription_required=True)
    headers = await auth_headers(buyer)
    await client.post(
        "/cart/items", json={"product_id": product.id, "quantity": 1}, headers=headers
    )

    cart = (await client.get("/cart", headers=headers)).json()
    assert cart["prescription_required"] is True

    blocked = await client.post(
        "/checkout",
        json={"shipping_address": ADDRESS},
        headers={**headers, "Idempotency-Key": uuid.uuid4().hex},
    )
    assert blocked.status_code == 409
    assert blocked.json()["error"]["code"] == "PRESCRIPTION_REQUIRED"

    prescription = (
        await client.post("/prescriptions", files={"file": PDF}, headers=headers)
    ).json()
    allowed = await client.post(
        "/checkout",
        json={"shipping_address": ADDRESS, "prescription_id": prescription["id"]},
        headers={**headers, "Idempotency-Key": uuid.uuid4().hex},
    )
    assert allowed.status_code == 201
    assert allowed.json()["order"]["prescription_status"] == "pending_review"


async def test_only_an_admin_may_review(client: AsyncClient, make_user, auth_headers) -> None:
    buyer = await make_user(email="rx.buyer5@example.com")
    admin = await make_user(email="rx.admin@example.com", role=UserRole.ADMIN)
    created = (
        await client.post("/prescriptions", files={"file": PDF}, headers=await auth_headers(buyer))
    ).json()

    refused = await client.post(
        f"/admin/prescriptions/{created['id']}/review",
        json={"status": "approved"},
        headers=await auth_headers(buyer),
    )
    assert refused.status_code == 403

    approved = await client.post(
        f"/admin/prescriptions/{created['id']}/review",
        json={"status": "approved"},
        headers=await auth_headers(admin),
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"

    # Reviewing twice is a conflict, not a silent overwrite.
    again = await client.post(
        f"/admin/prescriptions/{created['id']}/review",
        json={"status": "rejected", "reason": "changed my mind"},
        headers=await auth_headers(admin),
    )
    assert again.status_code == 409


async def test_a_rejection_needs_a_reason(client: AsyncClient, make_user, auth_headers) -> None:
    buyer = await make_user(email="rx.buyer6@example.com")
    admin = await make_user(email="rx.admin2@example.com", role=UserRole.ADMIN)
    created = (
        await client.post("/prescriptions", files={"file": PDF}, headers=await auth_headers(buyer))
    ).json()
    response = await client.post(
        f"/admin/prescriptions/{created['id']}/review",
        json={"status": "rejected"},
        headers=await auth_headers(admin),
    )
    assert response.status_code == 422
