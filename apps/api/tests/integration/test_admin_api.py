"""Admin oversight: seller approval, order visibility, users, and the audit log."""

from httpx import AsyncClient

from app.models.enums import ProductStatus, SellerStatus, UserRole


async def test_seller_verification_changes_status_and_is_audited(
    client: AsyncClient, session, make_seller, make_user, auth_headers
) -> None:
    from sqlalchemy import select

    from app.models.infra import AuditLog

    admin = await make_user(email="panel.admin@example.com", role=UserRole.ADMIN)
    seller = await make_seller(business_name="Pending Co", status=SellerStatus.PENDING)
    headers = await auth_headers(admin)

    queue = (
        await client.get("/admin/sellers", params={"status": "pending"}, headers=headers)
    ).json()
    assert seller.id in [item["id"] for item in queue["items"]]

    verified = await client.post(
        f"/admin/sellers/{seller.id}/verification", json={"status": "verified"}, headers=headers
    )
    assert verified.status_code == 200
    assert verified.json()["status"] == "verified"

    entries = (
        await session.execute(select(AuditLog).where(AuditLog.subject_id == seller.id))
    ).scalars()
    assert "seller.verification_changed" in [entry.action for entry in entries]


async def test_a_rejection_needs_a_reason(
    client: AsyncClient, make_seller, make_user, auth_headers
) -> None:
    admin = await make_user(email="panel.admin2@example.com", role=UserRole.ADMIN)
    seller = await make_seller(business_name="Rejected Co", status=SellerStatus.PENDING)
    response = await client.post(
        f"/admin/sellers/{seller.id}/verification",
        json={"status": "rejected"},
        headers=await auth_headers(admin),
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_suspending_a_seller_pulls_their_listings_off_the_storefront(
    client: AsyncClient, session, make_seller, make_product, make_user, auth_headers
) -> None:
    admin = await make_user(email="panel.admin3@example.com", role=UserRole.ADMIN)
    seller = await make_seller(business_name="Suspended Co")
    product = await make_product(seller=seller, name="Suspended item", sku="S-1")

    assert (await client.get(f"/products/{product.slug}")).status_code == 200

    await client.post(
        f"/admin/sellers/{seller.id}/verification",
        json={"status": "suspended", "reason": "Licence lapsed"},
        headers=await auth_headers(admin),
    )
    await session.refresh(product)
    assert product.status == ProductStatus.DRAFT
    assert (await client.get(f"/products/{product.slug}")).status_code == 404


async def test_user_management_records_a_role_change(
    client: AsyncClient, session, make_user, auth_headers
) -> None:
    from sqlalchemy import select

    from app.models.infra import AuditLog

    admin = await make_user(email="panel.admin4@example.com", role=UserRole.ADMIN)
    buyer = await make_user(email="promote.me@example.com")
    headers = await auth_headers(admin)

    listed = (await client.get("/admin/users", params={"q": "promote"}, headers=headers)).json()
    assert [item["email"] for item in listed["items"]] == ["promote.me@example.com"]

    updated = await client.patch(
        f"/admin/users/{buyer.id}",
        json={"role": "seller", "reason": "Approved to sell"},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["role"] == "seller"

    entries = (
        await session.execute(select(AuditLog).where(AuditLog.subject_id == buyer.id))
    ).scalars()
    assert "user.role_changed" in [entry.action for entry in entries]


async def test_the_audit_log_is_readable_by_admins_only(
    client: AsyncClient, make_user, auth_headers
) -> None:
    admin = await make_user(email="panel.admin5@example.com", role=UserRole.ADMIN)
    buyer = await make_user(email="nosy.buyer@example.com")

    assert (await client.get("/admin/audit", headers=await auth_headers(buyer))).status_code == 403
    response = await client.get("/admin/audit", headers=await auth_headers(admin))
    assert response.status_code == 200
    assert "items" in response.json()


async def test_admin_stats_report_the_queues(
    client: AsyncClient, make_seller, make_user, auth_headers
) -> None:
    admin = await make_user(email="panel.admin6@example.com", role=UserRole.ADMIN)
    await make_seller(business_name="Queued Co", status=SellerStatus.PENDING)
    body = (await client.get("/admin/stats", headers=await auth_headers(admin))).json()
    assert body["pending_sellers"] >= 1
    assert set(body) == {
        "pending_sellers",
        "pending_prescriptions",
        "orders_last_7d",
        "gmv_last_7d_minor",
        "currency",
        "active_products",
        "open_shipments",
    }
