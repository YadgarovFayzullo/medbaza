"""The authorization boundary: wrong role gets 403, wrong owner gets 404.

CLAUDE.md §3.5 requires both checks — the role gate in the router and the
ownership check in the service — and §11 requires each protected endpoint to be
tested for both.
"""

import uuid

from httpx import AsyncClient

from app.models.enums import SellerStatus, UserRole
from app.models.user import User

LISTING = {
    "name": "Contact-free thermometer",
    "sku": "NEW-1",
    "price_amount_minor": 2999,
    "stock": 5,
    "certifications": ["CE"],
    "status": "active",
}


async def test_protected_endpoints_reject_anonymous_callers(client: AsyncClient) -> None:
    for method, path in [
        ("get", "/orders"),
        ("get", "/account/addresses"),
        ("get", "/prescriptions"),
        ("get", "/seller/stats"),
        ("get", "/admin/stats"),
    ]:
        response = await getattr(client, method)(path)
        assert response.status_code == 401, path


async def test_a_buyer_cannot_reach_the_seller_dashboard(
    client: AsyncClient, make_user, auth_headers
) -> None:
    buyer = await make_user(email="plain.buyer@example.com")
    response = await client.get("/seller/stats", headers=await auth_headers(buyer))
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


async def test_a_seller_cannot_reach_the_admin_panel(
    client: AsyncClient, session, make_seller, auth_headers
) -> None:
    seller = await make_seller()
    owner = await session.get(User, seller.user_id)
    for path in ("/admin/stats", "/admin/sellers", "/admin/users", "/admin/orders"):
        response = await client.get(path, headers=await auth_headers(owner))
        assert response.status_code == 403, path


async def test_a_seller_cannot_touch_another_sellers_listing(
    client: AsyncClient, session, make_seller, make_product, auth_headers
) -> None:
    mine = await make_seller(business_name="Mine Medical")
    theirs = await make_seller(business_name="Theirs Medical")
    their_product = await make_product(seller=theirs, name="Their monitor", sku="T-1")

    me = await session.get(User, mine.user_id)
    headers = await auth_headers(me)

    # A row the actor may not see is reported as missing, never as forbidden.
    assert (
        await client.get(f"/seller/products/{their_product.id}", headers=headers)
    ).status_code == 404
    assert (
        await client.patch(
            f"/seller/products/{their_product.id}", json={"stock": 0}, headers=headers
        )
    ).status_code == 404
    assert (
        await client.put(
            "/seller/inventory",
            json={"product_id": their_product.id, "stock": 0},
            headers=headers,
        )
    ).status_code == 404


async def test_a_seller_sees_only_their_own_listings(
    client: AsyncClient, session, make_seller, make_product, auth_headers
) -> None:
    mine = await make_seller(business_name="Mine Medical")
    theirs = await make_seller(business_name="Theirs Medical")
    await make_product(seller=mine, name="My monitor", sku="M-1", slug="my-monitor")
    await make_product(seller=theirs, name="Their monitor", sku="T-1", slug="their-monitor")

    me = await session.get(User, mine.user_id)
    body = (await client.get("/seller/products", headers=await auth_headers(me))).json()
    assert [item["name"] for item in body["items"]] == ["My monitor"]


async def test_an_unverified_seller_cannot_publish(
    client: AsyncClient, session, make_seller, make_category, auth_headers
) -> None:
    seller = await make_seller(business_name="Pending Co", status=SellerStatus.PENDING)
    category = await make_category()
    owner = await session.get(User, seller.user_id)

    response = await client.post(
        "/seller/products",
        json={**LISTING, "category_id": category.id},
        headers=await auth_headers(owner),
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "SELLER_NOT_VERIFIED"


async def test_a_regulated_listing_needs_a_certification(
    client: AsyncClient, session, make_seller, make_category, auth_headers
) -> None:
    seller = await make_seller()
    category = await make_category(name="Protective equipment", slug="ppe")
    owner = await session.get(User, seller.user_id)
    headers = await auth_headers(owner)

    rejected = await client.post(
        "/seller/products",
        json={**LISTING, "category_id": category.id, "certifications": []},
        headers=headers,
    )
    assert rejected.status_code == 422
    assert rejected.json()["error"]["code"] == "CERTIFICATION_REQUIRED"

    # A draft is allowed without one — the gate is publication, not creation.
    draft = await client.post(
        "/seller/products",
        json={
            **LISTING,
            "category_id": category.id,
            "certifications": [],
            "status": "draft",
            "sku": "NEW-2",
        },
        headers=headers,
    )
    assert draft.status_code == 201


async def test_a_leaf_category_inherits_its_department_regulation(
    client: AsyncClient, session, make_seller, make_category, auth_headers
) -> None:
    """A product sits in a leaf, never in the department, so the gate has to walk up.

    Matching the leaf slug against the department set silently let every
    regulated listing through.
    """
    seller = await make_seller()
    department = await make_category(name="Protective equipment", slug="ppe")
    leaf = await make_category(name="Masks", slug="masks-respirators", parent=department)
    owner = await session.get(User, seller.user_id)
    headers = await auth_headers(owner)

    rejected = await client.post(
        "/seller/products",
        json={**LISTING, "category_id": leaf.id, "certifications": []},
        headers=headers,
    )
    assert rejected.status_code == 422
    assert rejected.json()["error"]["code"] == "CERTIFICATION_REQUIRED"

    accepted = await client.post(
        "/seller/products",
        json={**LISTING, "category_id": leaf.id, "certifications": ["CE"], "sku": "LEAF-1"},
        headers=headers,
    )
    assert accepted.status_code == 201


async def test_a_buyer_cannot_read_another_buyers_order(
    client: AsyncClient, make_product, make_user, auth_headers
) -> None:
    owner = await make_user(email="owner@example.com")
    stranger = await make_user(email="stranger@example.com")
    product = await make_product(stock=5)

    headers = await auth_headers(owner)
    await client.post(
        "/cart/items", json={"product_id": product.id, "quantity": 1}, headers=headers
    )
    order = (
        await client.post(
            "/checkout",
            json={
                "shipping_address": {
                    "recipient_name": "Owner",
                    "line1": "1 Road",
                    "city": "Portland",
                    "postal_code": "97205",
                    "country": "US",
                }
            },
            headers={**headers, "Idempotency-Key": uuid.uuid4().hex},
        )
    ).json()["order"]

    assert (
        await client.get(f"/orders/{order['id']}", headers=await auth_headers(stranger))
    ).status_code == 404
    assert (await client.get(f"/orders/{order['id']}", headers=headers)).status_code == 200


async def test_an_admin_cannot_demote_themselves(
    client: AsyncClient, make_user, auth_headers
) -> None:
    admin = await make_user(email="admin@example.com", role=UserRole.ADMIN)
    response = await client.patch(
        f"/admin/users/{admin.id}", json={"is_active": False}, headers=await auth_headers(admin)
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "CANNOT_DEMOTE_SELF"
