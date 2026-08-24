"""Admin panel: seller approval, order oversight, prescriptions, users."""

from typing import Annotated

from fastapi import APIRouter, Query, Request

from app.api.deps import Cursor, Limit, Transaction
from app.auth import DbSession, RequireAdmin, client_ip
from app.schemas.admin import (
    AdminOrderListItem,
    AdminStats,
    AdminUserListItem,
    AdminUserUpdate,
    AuditLogRead,
)
from app.schemas.common import Page
from app.schemas.orders import OrderRead, ShipmentTransitionRequest, order_read
from app.schemas.prescriptions import (
    PrescriptionAdminListItem,
    PrescriptionRead,
    PrescriptionReviewRequest,
)
from app.schemas.sellers import SellerAdminListItem, SellerVerificationRequest
from app.services import admin_service, audit_service, prescription_service, seller_service

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Transaction])


@router.get("/stats", response_model=AdminStats, operation_id="getAdminStats")
async def stats(session: DbSession, admin: RequireAdmin) -> AdminStats:
    """Counters for the admin overview: queues, GMV, and open work."""
    return AdminStats(**await admin_service.stats(session))


# --- sellers --------------------------------------------------------------


@router.get("/sellers", response_model=Page[SellerAdminListItem], operation_id="listAdminSellers")
async def list_sellers(
    session: DbSession,
    admin: RequireAdmin,
    status_filter: Annotated[
        str | None, Query(alias="status", description="pending | verified | rejected | suspended")
    ] = None,
    limit: Limit = 20,
    cursor: Cursor = None,
) -> Page[SellerAdminListItem]:
    """Seller accounts with their submitted licence and certification references."""
    rows, next_cursor = await admin_service.list_sellers(
        session, status=status_filter, limit=limit, cursor=cursor
    )
    return Page(
        items=[
            SellerAdminListItem.model_validate(seller).model_copy(update={"product_count": count})
            for seller, count in rows
        ],
        next_cursor=next_cursor,
    )


@router.post(
    "/sellers/{seller_id}/verification",
    response_model=SellerAdminListItem,
    operation_id="setSellerVerification",
)
async def set_verification(
    seller_id: str,
    payload: SellerVerificationRequest,
    request: Request,
    session: DbSession,
    admin: RequireAdmin,
) -> SellerAdminListItem:
    """Verify, reject, or suspend a seller. Written to the audit log."""
    seller = await seller_service.set_verification(
        session,
        seller_id=seller_id,
        status=payload.status,
        reason=payload.reason,
        admin_id=admin.id,
        ip_address=client_ip(request),
    )
    return SellerAdminListItem.model_validate(seller)


# --- prescriptions --------------------------------------------------------


@router.get(
    "/prescriptions",
    response_model=Page[PrescriptionAdminListItem],
    operation_id="listPendingPrescriptions",
)
async def list_pending_prescriptions(
    session: DbSession, admin: RequireAdmin, limit: Limit = 20, cursor: Cursor = None
) -> Page[PrescriptionAdminListItem]:
    """The prescription review queue, oldest first. Metadata only."""
    rows, next_cursor = await prescription_service.list_pending(session, limit=limit, cursor=cursor)
    return Page(
        items=[PrescriptionAdminListItem.model_validate(p) for p in rows],
        next_cursor=next_cursor,
    )


@router.post(
    "/prescriptions/{prescription_id}/review",
    response_model=PrescriptionRead,
    operation_id="reviewPrescription",
)
async def review_prescription(
    prescription_id: str,
    payload: PrescriptionReviewRequest,
    request: Request,
    session: DbSession,
    admin: RequireAdmin,
) -> PrescriptionRead:
    """Approve or reject a prescription. Only admins may transition it."""
    prescription = await prescription_service.review(
        session,
        prescription_id=prescription_id,
        status=payload.status,
        reason=payload.reason,
        admin=admin,
        ip_address=client_ip(request),
    )
    return PrescriptionRead.model_validate(prescription)


# --- orders ---------------------------------------------------------------


@router.get("/orders", response_model=Page[AdminOrderListItem], operation_id="listAdminOrders")
async def list_orders(
    session: DbSession,
    admin: RequireAdmin,
    status_filter: Annotated[str | None, Query(alias="status")] = None,
    limit: Limit = 20,
    cursor: Cursor = None,
) -> Page[AdminOrderListItem]:
    """Every order, newest first, with its derived status."""
    orders, next_cursor = await admin_service.list_orders(
        session, status=status_filter, limit=limit, cursor=cursor
    )
    return Page(
        items=[
            AdminOrderListItem(
                id=o.id,
                number=o.number,
                status=o.status,
                total_amount_minor=o.total_amount_minor,
                currency=o.currency,
                seller_count=len(o.shipments),
                buyer_id=o.buyer_id,
                prescription_required=o.prescription_required,
                created_at=o.created_at,
            )
            for o in orders
        ],
        next_cursor=next_cursor,
    )


@router.get("/orders/{order_id}", response_model=OrderRead, operation_id="getAdminOrder")
async def get_order(order_id: str, session: DbSession, admin: RequireAdmin) -> OrderRead:
    """One order in full, including its transition history."""
    return order_read(await admin_service.get_order(session, order_id))


@router.post(
    "/shipments/{shipment_id}/transition",
    operation_id="adminTransitionShipment",
    response_model=OrderRead,
)
async def transition_shipment(
    shipment_id: str,
    payload: ShipmentTransitionRequest,
    request: Request,
    session: DbSession,
    admin: RequireAdmin,
) -> OrderRead:
    """Override a shipment's state. Always audited; refunds are logged as such."""
    shipment = await admin_service.transition_shipment(
        session,
        shipment_id=shipment_id,
        to_status=payload.to_status,
        reason=payload.reason,
        admin=admin,
        ip_address=client_ip(request),
    )
    return order_read(await admin_service.get_order(session, shipment.order_id))


# --- users ----------------------------------------------------------------


@router.get("/users", response_model=Page[AdminUserListItem], operation_id="listAdminUsers")
async def list_users(
    session: DbSession,
    admin: RequireAdmin,
    role: Annotated[str | None, Query(description="buyer | seller | admin")] = None,
    q: Annotated[str | None, Query(max_length=120, description="Email fragment.")] = None,
    limit: Limit = 20,
    cursor: Cursor = None,
) -> Page[AdminUserListItem]:
    """User accounts, filterable by role or email fragment."""
    rows, next_cursor = await admin_service.list_users(
        session, role=role, q=q, limit=limit, cursor=cursor
    )
    return Page(items=[AdminUserListItem.model_validate(u) for u in rows], next_cursor=next_cursor)


@router.patch("/users/{user_id}", response_model=AdminUserListItem, operation_id="updateAdminUser")
async def update_user(
    user_id: str,
    payload: AdminUserUpdate,
    request: Request,
    session: DbSession,
    admin: RequireAdmin,
) -> AdminUserListItem:
    """Change a user's role or activation. Both are audited."""
    user = await admin_service.update_user(
        session,
        user_id=user_id,
        role=payload.role,
        is_active=payload.is_active,
        reason=payload.reason,
        admin=admin,
        ip_address=client_ip(request),
    )
    return AdminUserListItem.model_validate(user)


# --- audit ----------------------------------------------------------------


@router.get("/audit", response_model=Page[AuditLogRead], operation_id="listAuditLog")
async def list_audit(
    session: DbSession,
    admin: RequireAdmin,
    action: Annotated[str | None, Query(max_length=64)] = None,
    subject_id: Annotated[str | None, Query(max_length=36)] = None,
    limit: Limit = 50,
    cursor: Cursor = None,
) -> Page[AuditLogRead]:
    """The append-only audit trail. Entries carry IDs, never document contents."""
    rows, next_cursor = await audit_service.list_entries(
        session, action=action, subject_id=subject_id, limit=limit, cursor=cursor
    )
    return Page(items=[AuditLogRead.model_validate(r) for r in rows], next_cursor=next_cursor)
