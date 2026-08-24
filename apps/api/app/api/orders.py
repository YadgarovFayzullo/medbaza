"""Buyer-facing orders: history, tracking, cancellation, returns."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import Cursor, Limit, Transaction
from app.auth import CurrentUser, DbSession
from app.schemas.common import Page
from app.schemas.orders import (
    CancelOrderRequest,
    OrderListItem,
    OrderRead,
    ShipmentRead,
    order_list_item,
    order_read,
    shipment_read,
)
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["orders"], dependencies=[Transaction])


@router.get("", response_model=Page[OrderListItem], operation_id="listOrders")
async def list_orders(
    session: DbSession, user: CurrentUser, limit: Limit = 20, cursor: Cursor = None
) -> Page[OrderListItem]:
    """The signed-in buyer's order history, newest first."""
    orders, next_cursor = await order_service.list_buyer_orders(
        session, user.id, limit=limit, cursor=cursor
    )
    return Page(items=[order_list_item(o) for o in orders], next_cursor=next_cursor)


@router.get("/lookup", response_model=OrderRead, operation_id="lookupGuestOrder")
async def lookup_guest_order(
    session: DbSession,
    number: Annotated[str, Query(description="Order number, e.g. MB-202608-A1B2C3.")],
    email: Annotated[str, Query(description="The email used at guest checkout.")],
) -> OrderRead:
    """Guest order tracking. The order number alone is not enough to see an order."""
    order = await order_service.get_order_by_number(session, number, email=email)
    return order_read(order)


@router.get("/{order_id}", response_model=OrderRead, operation_id="getOrder")
async def get_order(order_id: str, session: DbSession, user: CurrentUser) -> OrderRead:
    """One order with its shipments and full transition history."""
    order = await order_service.get_order(session, order_id, buyer_id=user.id)
    return order_read(order)


@router.post("/{order_id}/cancel", response_model=OrderRead, operation_id="cancelOrder")
async def cancel_order(
    order_id: str, payload: CancelOrderRequest, session: DbSession, user: CurrentUser
) -> OrderRead:
    """Cancel every shipment that has not yet been dispatched, restoring stock."""
    order = await order_service.cancel_order(
        session, order_id, buyer_id=user.id, reason=payload.reason
    )
    return order_read(order)


@router.post(
    "/shipments/{shipment_id}/return",
    response_model=ShipmentRead,
    operation_id="requestShipmentReturn",
)
async def request_return(
    shipment_id: str, payload: CancelOrderRequest, session: DbSession, user: CurrentUser
) -> ShipmentRead:
    """Open a return on a delivered shipment."""
    shipment = await order_service.request_return(
        session, shipment_id=shipment_id, buyer_id=user.id, reason=payload.reason
    )
    return shipment_read(shipment)
