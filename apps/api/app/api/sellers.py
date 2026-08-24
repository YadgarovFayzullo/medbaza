"""Seller dashboard and public seller profiles."""

from typing import Annotated

from fastapi import APIRouter, Query, status

from app.api.deps import Cursor, Limit, Transaction
from app.auth import CurrentSeller, CurrentUser, DbSession
from app.schemas.catalog import ProductCreate, ProductListItem, ProductRead, ProductUpdate
from app.schemas.common import Page
from app.schemas.orders import (
    SellerShipmentListItem,
    SellerShipmentRead,
    ShipmentTransitionRequest,
    seller_shipment_list_item,
    seller_shipment_read,
)
from app.schemas.sellers import (
    InventoryAdjustment,
    PayoutStatusRead,
    SellerApplication,
    SellerDashboardStats,
    SellerPrivate,
    SellerPublic,
    SellerUpdate,
)
from app.services import catalog_service, inventory_service, order_service, seller_service

router = APIRouter(prefix="/sellers", tags=["sellers"], dependencies=[Transaction])


# --- applying -------------------------------------------------------------
# Declared before `/{slug}` so the literal path is not captured by it.


@router.post(
    "/apply",
    response_model=SellerPrivate,
    status_code=status.HTTP_201_CREATED,
    operation_id="applyAsSeller",
)
async def apply(payload: SellerApplication, session: DbSession, user: CurrentUser) -> SellerPrivate:
    """Apply to sell. The account stays pending until an admin verifies it."""
    seller = await seller_service.apply(session, user, payload)
    return SellerPrivate.model_validate(seller)


# --- public ---------------------------------------------------------------


@router.get("/{slug}", response_model=SellerPublic, operation_id="getSellerProfile")
async def get_seller_profile(slug: str, session: DbSession) -> SellerPublic:
    """Storefront profile for a verified seller. Never exposes payout or tax data."""
    seller, product_count = await seller_service.get_public_profile(session, slug)
    return SellerPublic.model_validate(seller).model_copy(update={"product_count": product_count})


# --- the seller's own account --------------------------------------------

me_router = APIRouter(prefix="/seller", tags=["seller"], dependencies=[Transaction])


@me_router.get("/me", response_model=SellerPrivate, operation_id="getMySellerAccount")
async def get_my_account(seller: CurrentSeller) -> SellerPrivate:
    """The seller's own account, including verification state."""
    return SellerPrivate.model_validate(seller)


@me_router.patch("/me", response_model=SellerPrivate, operation_id="updateMySellerAccount")
async def update_my_account(
    payload: SellerUpdate, session: DbSession, seller: CurrentSeller
) -> SellerPrivate:
    """Update the seller's storefront details."""
    return SellerPrivate.model_validate(
        await seller_service.update_profile(session, seller, payload)
    )


@me_router.get("/stats", response_model=SellerDashboardStats, operation_id="getSellerStats")
async def stats(session: DbSession, seller: CurrentSeller) -> SellerDashboardStats:
    """Dashboard counters, scoped to this seller's own rows."""
    return SellerDashboardStats(**await seller_service.dashboard_stats(session, seller))


@me_router.get("/payouts", response_model=PayoutStatusRead, operation_id="getSellerPayoutStatus")
async def payouts(seller: CurrentSeller) -> PayoutStatusRead:
    """Payout readiness, read through the payment port.

    While the provider decision in CLAUDE.md §4 is open this reports the fake
    provider — payout schedule and funds-in-transit are deferred there.
    """
    return PayoutStatusRead(**await seller_service.payout_status(seller))


# --- listings -------------------------------------------------------------


@me_router.get("/products", response_model=Page[ProductListItem], operation_id="listMyProducts")
async def list_my_products(
    session: DbSession,
    seller: CurrentSeller,
    status_filter: Annotated[
        str | None, Query(alias="status", description="draft | active | archived")
    ] = None,
    q: Annotated[str | None, Query(max_length=120)] = None,
    limit: Limit = 24,
    cursor: Cursor = None,
) -> Page[ProductListItem]:
    """This seller's listings, including drafts and archived rows."""
    products, next_cursor = await catalog_service.list_seller_products(
        session, seller, status=status_filter, q=q, limit=limit, cursor=cursor
    )
    return Page(
        items=[ProductListItem.model_validate(p) for p in products], next_cursor=next_cursor
    )


@me_router.post(
    "/products",
    response_model=ProductRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="createMyProduct",
)
async def create_my_product(
    payload: ProductCreate, session: DbSession, seller: CurrentSeller
) -> ProductRead:
    """Create a listing. Regulated categories require a CE/FDA/ISO certification."""
    product = await catalog_service.create_product(session, seller, payload)
    await session.refresh(product, ["category", "seller"])
    return ProductRead.model_validate(product)


@me_router.get("/products/{product_id}", response_model=ProductRead, operation_id="getMyProduct")
async def get_my_product(product_id: str, session: DbSession, seller: CurrentSeller) -> ProductRead:
    """One of this seller's listings."""
    product = await catalog_service.get_seller_product(session, seller, product_id)
    await session.refresh(product, ["category", "seller"])
    return ProductRead.model_validate(product)


@me_router.patch(
    "/products/{product_id}", response_model=ProductRead, operation_id="updateMyProduct"
)
async def update_my_product(
    product_id: str, payload: ProductUpdate, session: DbSession, seller: CurrentSeller
) -> ProductRead:
    """Partially update a listing."""
    product = await catalog_service.update_product(session, seller, product_id, payload)
    await session.refresh(product, ["category", "seller"])
    return ProductRead.model_validate(product)


@me_router.delete(
    "/products/{product_id}", response_model=ProductRead, operation_id="archiveMyProduct"
)
async def archive_my_product(
    product_id: str, session: DbSession, seller: CurrentSeller
) -> ProductRead:
    """Archive a listing. Listings that have been ordered are never hard-deleted."""
    product = await catalog_service.archive_product(session, seller, product_id)
    await session.refresh(product, ["category", "seller"])
    return ProductRead.model_validate(product)


@me_router.put("/inventory", response_model=ProductListItem, operation_id="setMyProductStock")
async def set_stock(
    payload: InventoryAdjustment, session: DbSession, seller: CurrentSeller
) -> ProductListItem:
    """Set a listing's stock level, under the same row lock checkout uses (§5.3)."""
    product = await inventory_service.set_stock(
        session, seller.id, payload.product_id, payload.stock
    )
    await session.refresh(product, ["seller"])
    return ProductListItem.model_validate(product)


# --- fulfilment -----------------------------------------------------------


@me_router.get(
    "/shipments",
    response_model=Page[SellerShipmentListItem],
    operation_id="listMyShipments",
)
async def list_my_shipments(
    session: DbSession,
    seller: CurrentSeller,
    status_filter: Annotated[str | None, Query(alias="status")] = None,
    limit: Limit = 20,
    cursor: Cursor = None,
) -> Page[SellerShipmentListItem]:
    """Orders to fulfil. A seller sees only their own shipment, never the
    order total or the buyer's other sellers (§5.2)."""
    shipments, next_cursor = await order_service.list_seller_shipments(
        session, seller.id, status=status_filter, limit=limit, cursor=cursor
    )
    return Page(items=[seller_shipment_list_item(s) for s in shipments], next_cursor=next_cursor)


@me_router.get(
    "/shipments/{shipment_id}",
    response_model=SellerShipmentRead,
    operation_id="getMyShipment",
)
async def get_my_shipment(
    shipment_id: str, session: DbSession, seller: CurrentSeller
) -> SellerShipmentRead:
    """One shipment with the items and the address needed to fulfil it."""
    shipment = await order_service.get_seller_shipment(session, seller.id, shipment_id)
    events = await order_service.seller_shipment_events(session, shipment.id)
    return seller_shipment_read(shipment, events)


@me_router.post(
    "/shipments/{shipment_id}/transition",
    response_model=SellerShipmentRead,
    operation_id="transitionMyShipment",
)
async def transition_my_shipment(
    shipment_id: str,
    payload: ShipmentTransitionRequest,
    session: DbSession,
    seller: CurrentSeller,
    user: CurrentUser,
) -> SellerShipmentRead:
    """Advance a shipment's status. Illegal moves are rejected, never applied."""
    shipment = await order_service.seller_transition(
        session,
        seller.id,
        shipment_id,
        to_status=payload.to_status,
        actor_id=user.id,
        carrier=payload.carrier,
        tracking_number=payload.tracking_number,
        reason=payload.reason,
    )
    events = await order_service.seller_shipment_events(session, shipment.id)
    return seller_shipment_read(shipment, events)
