"""Catalog browsing: filters, cursor pagination, detail, and visibility."""

import pytest
from httpx import AsyncClient

from app.models.enums import ProductStatus, SellerStatus


async def test_listing_only_shows_active_products(
    client: AsyncClient, make_product, make_seller
) -> None:
    seller = await make_seller()
    await make_product(seller=seller, name="Visible monitor", sku="A1")
    await make_product(seller=seller, name="Draft monitor", sku="A2", status=ProductStatus.DRAFT)

    body = (await client.get("/products")).json()
    names = [item["name"] for item in body["items"]]
    assert "Visible monitor" in names
    assert "Draft monitor" not in names


async def test_filters_are_applied(
    client: AsyncClient, make_product, make_seller, make_category
) -> None:
    seller = await make_seller()
    diagnostics = await make_category(name="Diagnostics", slug="diagnostics")
    ppe = await make_category(name="PPE", slug="ppe")
    await make_product(
        seller=seller,
        category=diagnostics,
        name="Clinic thermometer",
        sku="D-1",
        price_amount_minor=2500,
        certifications=["CE", "FDA"],
    )
    await make_product(
        seller=seller,
        category=ppe,
        name="Nitrile gloves",
        sku="P-1",
        price_amount_minor=900,
        stock=0,
        certifications=["ISO"],
    )
    await make_product(
        seller=seller,
        category=ppe,
        name="Salbutamol inhaler",
        sku="P-2",
        price_amount_minor=1800,
        prescription_required=True,
        certifications=["FDA"],
    )

    async def names(**params: object) -> list[str]:
        body = (await client.get("/products", params=params)).json()
        return [item["name"] for item in body["items"]]

    assert await names(category="diagnostics") == ["Clinic thermometer"]
    assert "Nitrile gloves" not in await names(in_stock=True)
    assert await names(certification="ISO") == ["Nitrile gloves"]
    assert await names(prescription_required=True) == ["Salbutamol inhaler"]
    assert await names(max_price_minor=1000) == ["Nitrile gloves"]
    assert await names(q="inhaler") == ["Salbutamol inhaler"]
    assert await names(sort="price_asc") == [
        "Nitrile gloves",
        "Salbutamol inhaler",
        "Clinic thermometer",
    ]


async def test_cursor_pagination_walks_the_catalog_without_repeats(
    client: AsyncClient, make_product, make_seller
) -> None:
    seller = await make_seller()
    for index in range(7):
        await make_product(
            seller=seller,
            name=f"Item {index}",
            slug=f"item-{index}",
            sku=f"SKU-{index}",
            price_amount_minor=1000 + index,
        )

    seen: list[str] = []
    cursor = None
    for _ in range(5):
        params = {"limit": 3, "sort": "newest"}
        if cursor:
            params["cursor"] = cursor
        page = (await client.get("/products", params=params)).json()
        seen.extend(item["id"] for item in page["items"])
        cursor = page["next_cursor"]
        if cursor is None:
            break

    assert cursor is None
    assert len(seen) == len(set(seen)) >= 7


async def test_product_detail_and_related(client: AsyncClient, make_product, make_seller) -> None:
    seller = await make_seller()
    product = await make_product(seller=seller, name="Pulse oximeter", sku="OX-1")
    await make_product(
        seller=seller,
        category=None,
        name="Second oximeter",
        sku="OX-2",
        slug="second-oximeter",
    )

    detail = await client.get(f"/products/{product.slug}")
    assert detail.status_code == 200
    body = detail.json()
    assert body["seller"]["verified"] is True
    assert body["certifications"] == ["CE"]
    assert "specs" in body

    related = await client.get(f"/products/{product.slug}/related")
    assert related.status_code == 200


async def test_missing_product_returns_the_error_envelope(client: AsyncClient) -> None:
    response = await client.get("/products/does-not-exist")
    assert response.status_code == 404
    error = response.json()["error"]
    assert error["code"] == "NOT_FOUND"
    assert error["request_id"]


async def test_search_suggestions(client: AsyncClient, make_product, make_seller) -> None:
    seller = await make_seller()
    await make_product(seller=seller, name="Infrared thermometer", sku="T-1")
    body = (await client.get("/search/suggest", params={"q": "therm"})).json()
    labels = [s["label"] for s in body["suggestions"]]
    assert any("thermometer" in label.lower() for label in labels)


async def test_categories_are_returned_as_a_tree(
    client: AsyncClient, session, make_category
) -> None:
    from app.models.category import Category

    parent = await make_category(name="Diagnostics", slug="diagnostics")
    session.add(Category(name="Thermometers", slug="thermometers", parent_id=parent.id))
    await session.flush()

    tree = (await client.get("/categories")).json()
    node = next(c for c in tree if c["slug"] == "diagnostics")
    assert [child["slug"] for child in node["children"]] == ["thermometers"]


async def test_an_unverified_seller_has_no_storefront(client: AsyncClient, make_seller) -> None:
    seller = await make_seller(business_name="Pending Co", status=SellerStatus.PENDING)
    assert (await client.get(f"/sellers/{seller.slug}")).status_code == 404


async def test_category_counts_roll_up_from_sub_categories(
    client: AsyncClient, session, make_product, make_seller, make_category
) -> None:
    """A department holds no products directly, so its count is its subtree's."""
    from app.models.category import Category

    seller = await make_seller()
    parent = await make_category(name="Diagnostika", slug="diagnostics")
    child = Category(name="Termometrlar", slug="thermometers", parent_id=parent.id)
    session.add(child)
    await session.commit()

    await make_product(seller=seller, category=child, name="Termometr A", sku="C-1", slug="t-a")
    await make_product(seller=seller, category=child, name="Termometr B", sku="C-2", slug="t-b")

    tree = (await client.get("/categories")).json()
    node = next(c for c in tree if c["slug"] == "diagnostics")

    assert node["product_count"] == 2
    assert node["children"][0]["product_count"] == 2
    # And it agrees with what browsing the department actually returns.
    listing = (await client.get("/products", params={"category": "diagnostics"})).json()
    assert len(listing["items"]) == 2


async def test_a_rating_above_five_cannot_be_stored(session, make_product, make_seller) -> None:
    """The counters are denormalised, so the range lives in the database."""
    from sqlalchemy.exc import IntegrityError

    seller = await make_seller()
    product = await make_product(seller=seller, name="Reyting", sku="R-1", slug="reyting")

    product.rating_count = 4
    product.rating_sum = 40  # an average of 10 on a 1-5 scale
    with pytest.raises(IntegrityError):
        await session.commit()
    await session.rollback()
