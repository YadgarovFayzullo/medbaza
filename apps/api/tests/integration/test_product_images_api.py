"""Seller catalog photos: upload, ordering, removal, and the authorization boundary."""

import struct
import zlib
from typing import Any

import pytest
from httpx import AsyncClient

from app.models.enums import SellerStatus
from app.models.user import User
from app.services import outbox_service


def _png(size: int = 8) -> bytes:
    """A real PNG, so the endpoint is exercised on bytes a browser would send."""

    def chunk(tag: bytes, data: bytes) -> bytes:
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    raw = b"".join(b"\x00" + bytes([0, 150, 199] * size) for _ in range(size))
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw))
        + chunk(b"IEND", b"")
    )


@pytest.fixture
def upload(client: AsyncClient):
    async def _upload(product_id: str, headers: dict[str, str], **kwargs: Any):
        files = kwargs.pop("files", {"file": ("photo.png", _png(), "image/png")})
        return await client.post(
            f"/seller/products/{product_id}/images", headers=headers, files=files
        )

    return _upload


async def test_a_seller_uploads_a_photo_and_it_becomes_the_thumbnail(
    session, make_seller, make_product, auth_headers, upload
) -> None:
    seller = await make_seller(status=SellerStatus.VERIFIED)
    product = await make_product(seller=seller)
    headers = await auth_headers(await session.get(User, seller.user_id))

    response = await upload(product.id, headers)

    assert response.status_code == 201
    body = response.json()
    assert len(body["images"]) == 1
    # The first image is what the storefront grid shows.
    assert body["image_url"] == body["images"][0]


async def test_photos_stack_into_a_carousel_in_upload_order(
    session, make_seller, make_product, auth_headers, upload
) -> None:
    seller = await make_seller(status=SellerStatus.VERIFIED)
    product = await make_product(seller=seller)
    headers = await auth_headers(await session.get(User, seller.user_id))

    first = (await upload(product.id, headers)).json()["images"]
    second = (await upload(product.id, headers)).json()["images"]

    assert len(second) == 2
    assert second[0] == first[0]


async def test_a_non_photo_is_rejected(
    session, make_seller, make_product, auth_headers, upload
) -> None:
    seller = await make_seller(status=SellerStatus.VERIFIED)
    product = await make_product(seller=seller)
    headers = await auth_headers(await session.get(User, seller.user_id))

    response = await upload(
        product.id, headers, files={"file": ("x.svg", b"<svg onload=alert(1)>", "image/svg+xml")}
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_a_seller_cannot_add_a_photo_to_another_sellers_listing(
    session, make_seller, make_product, auth_headers, upload
) -> None:
    owner = await make_seller(status=SellerStatus.VERIFIED)
    product = await make_product(seller=owner)
    intruder = await make_seller(
        status=SellerStatus.VERIFIED, business_name="Rival", email="rival@example.com"
    )
    headers = await auth_headers(await session.get(User, intruder.user_id))

    response = await upload(product.id, headers)

    # 404, not 403: the API must not leak that the listing exists (§3.5).
    assert response.status_code == 404


async def test_a_buyer_cannot_upload_at_all(make_user, make_product, auth_headers, upload) -> None:
    product = await make_product()
    buyer = await make_user(email="buyer@example.com", role="buyer")
    headers = await auth_headers(buyer)

    assert (await upload(product.id, headers)).status_code == 403


async def test_deleting_a_photo_drops_it_from_the_listing(
    client: AsyncClient, session, make_seller, make_product, auth_headers, upload
) -> None:
    seller = await make_seller(status=SellerStatus.VERIFIED)
    product = await make_product(seller=seller)
    headers = await auth_headers(await session.get(User, seller.user_id))
    uploaded = (await upload(product.id, headers)).json()["images"][0]

    response = await client.request(
        "DELETE",
        f"/seller/products/{product.id}/images",
        headers=headers,
        params={"key": uploaded},
    )

    assert response.status_code == 200
    assert response.json()["images"] == []


async def test_deleting_an_unknown_photo_is_a_404(
    client: AsyncClient, session, make_seller, make_product, auth_headers
) -> None:
    seller = await make_seller(status=SellerStatus.VERIFIED)
    product = await make_product(seller=seller)
    headers = await auth_headers(await session.get(User, seller.user_id))

    response = await client.request(
        "DELETE",
        f"/seller/products/{product.id}/images",
        headers=headers,
        params={"key": "products/nope/deadbeef.png"},
    )

    assert response.status_code == 404


async def test_a_photo_change_queues_a_storefront_cache_bust(
    session, make_seller, make_product, auth_headers, upload
) -> None:
    """Without this the storefront serves the old page until ISR expires (§3.8)."""
    from sqlalchemy import select

    from app.models.infra import OutboxEvent

    seller = await make_seller(status=SellerStatus.VERIFIED)
    product = await make_product(seller=seller)
    headers = await auth_headers(await session.get(User, seller.user_id))

    await upload(product.id, headers)

    events = (
        (
            await session.execute(
                select(OutboxEvent).where(OutboxEvent.event_type == outbox_service.PRODUCT_REINDEX)
            )
        )
        .scalars()
        .all()
    )
    assert [event.payload["product_id"] for event in events] == [product.id]
