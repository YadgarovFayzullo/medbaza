from datetime import datetime
from typing import TYPE_CHECKING, Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import ShipmentStatus

if TYPE_CHECKING:
    # Type-only: the presenters below read ORM instances but nothing here
    # depends on SQLAlchemy at runtime.
    from app.models.order import Order, OrderEvent, Shipment


class AddressInput(BaseModel):
    recipient_name: Annotated[str, Field(min_length=1, max_length=255)]
    line1: Annotated[str, Field(min_length=1, max_length=255)]
    line2: Annotated[str | None, Field(default=None, max_length=255)] = None
    city: Annotated[str, Field(min_length=1, max_length=128)]
    region: Annotated[str | None, Field(default=None, max_length=128)] = None
    postal_code: Annotated[str, Field(min_length=1, max_length=32)]
    country: Annotated[str, Field(min_length=2, max_length=2)]
    phone: Annotated[str | None, Field(default=None, max_length=32)] = None


class AddressRead(AddressInput):
    model_config = ConfigDict(from_attributes=True)

    id: str
    label: str
    is_default: bool


class AddressCreate(AddressInput):
    label: Annotated[str, Field(default="Home", max_length=64)] = "Home"
    is_default: bool = False


class OrderItemRead(BaseModel):
    """Rendered entirely from the purchase-time snapshot (§5.2)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str | None
    product_name: str
    product_slug: str
    sku: str
    image_url: str | None
    quantity: int
    unit_amount_minor: int
    line_amount_minor: int
    currency: str
    prescription_required: bool


class ShipmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    seller_id: str
    seller_name: str
    status: str
    carrier: str | None
    tracking_number: str | None
    items_amount_minor: int
    shipping_amount_minor: int
    total_amount_minor: int
    currency: str
    items: list[OrderItemRead]


class OrderEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    shipment_id: str | None
    from_status: str | None
    to_status: str
    reason: str | None
    created_at: datetime


class OrderListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    number: str
    status: str
    total_amount_minor: int
    currency: str
    item_count: int
    seller_count: int
    created_at: datetime


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    number: str
    status: str
    currency: str
    items_amount_minor: int
    shipping_amount_minor: int
    tax_amount_minor: int
    total_amount_minor: int
    shipping_address: AddressInput
    prescription_required: bool
    prescription_id: str | None
    prescription_status: str | None
    shipments: list[ShipmentRead]
    events: list[OrderEventRead]
    created_at: datetime


class CheckoutRequest(BaseModel):
    shipping_address: AddressInput
    # Guest checkout: required when there is no authenticated buyer.
    email: EmailStr | None = None
    prescription_id: str | None = None
    notes: Annotated[str | None, Field(default=None, max_length=500)] = None


class CheckoutResponse(BaseModel):
    order: OrderRead
    # Where to send the buyer to pay. Opaque — no PSP semantics assumed (§3.7).
    payment_redirect_url: str


class CancelOrderRequest(BaseModel):
    reason: Annotated[str, Field(min_length=1, max_length=500)]


# --- seller-facing --------------------------------------------------------


class SellerShipmentListItem(BaseModel):
    """What a seller sees: their own shipment only, never the order total or
    the buyer's other sellers (§5.2)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    order_number: str
    status: str
    item_count: int
    items_amount_minor: int
    shipping_amount_minor: int
    platform_fee_amount_minor: int
    seller_payout_amount_minor: int
    currency: str
    ship_city: str
    ship_country: str
    created_at: datetime


class SellerShipmentRead(SellerShipmentListItem):
    items: list[OrderItemRead]
    carrier: str | None
    tracking_number: str | None
    recipient_name: str
    ship_line1: str
    ship_line2: str | None
    ship_postal_code: str
    ship_region: str | None
    events: list[OrderEventRead]


class ShipmentTransitionRequest(BaseModel):
    to_status: Literal[
        ShipmentStatus.PROCESSING,
        ShipmentStatus.SHIPPED,
        ShipmentStatus.DELIVERED,
        ShipmentStatus.CANCELLED,
    ]
    carrier: Annotated[str | None, Field(default=None, max_length=64)] = None
    tracking_number: Annotated[str | None, Field(default=None, max_length=128)] = None
    reason: Annotated[str | None, Field(default=None, max_length=500)] = None


def shipment_read(shipment: "Shipment") -> ShipmentRead:
    return ShipmentRead(
        id=shipment.id,
        seller_id=shipment.seller_id,
        seller_name=shipment.seller.business_name if shipment.seller else "Seller",
        status=shipment.status,
        carrier=shipment.carrier,
        tracking_number=shipment.tracking_number,
        items_amount_minor=shipment.items_amount_minor,
        shipping_amount_minor=shipment.shipping_amount_minor,
        total_amount_minor=shipment.total_amount_minor,
        currency=shipment.currency,
        items=[OrderItemRead.model_validate(i) for i in shipment.items],
    )


def order_read(order: "Order") -> OrderRead:
    """Buyer-facing order view, assembled from the purchase-time snapshot."""
    return OrderRead(
        id=order.id,
        number=order.number,
        status=order.status,
        currency=order.currency,
        items_amount_minor=order.items_amount_minor,
        shipping_amount_minor=order.shipping_amount_minor,
        tax_amount_minor=order.tax_amount_minor,
        total_amount_minor=order.total_amount_minor,
        shipping_address=AddressInput(
            recipient_name=order.ship_recipient_name,
            line1=order.ship_line1,
            line2=order.ship_line2,
            city=order.ship_city,
            region=order.ship_region,
            postal_code=order.ship_postal_code,
            country=order.ship_country,
            phone=order.ship_phone,
        ),
        prescription_required=order.prescription_required,
        prescription_id=order.prescription_id,
        prescription_status=order.prescription.status if order.prescription else None,
        shipments=[shipment_read(s) for s in order.shipments],
        events=[OrderEventRead.model_validate(e) for e in sorted(order.events, key=lambda e: e.id)],
        created_at=order.created_at,
    )


def order_list_item(order: "Order") -> OrderListItem:
    return OrderListItem(
        id=order.id,
        number=order.number,
        status=order.status,
        total_amount_minor=order.total_amount_minor,
        currency=order.currency,
        item_count=sum(i.quantity for s in order.shipments for i in s.items),
        seller_count=len(order.shipments),
        created_at=order.created_at,
    )


def seller_shipment_list_item(shipment: "Shipment") -> SellerShipmentListItem:
    """Deliberately omits the order total and the buyer's other sellers (§5.2)."""
    return SellerShipmentListItem(
        id=shipment.id,
        order_number=shipment.order.number,
        status=shipment.status,
        item_count=sum(i.quantity for i in shipment.items),
        items_amount_minor=shipment.items_amount_minor,
        shipping_amount_minor=shipment.shipping_amount_minor,
        platform_fee_amount_minor=shipment.platform_fee_amount_minor,
        seller_payout_amount_minor=shipment.seller_payout_amount_minor,
        currency=shipment.currency,
        ship_city=shipment.order.ship_city,
        ship_country=shipment.order.ship_country,
        created_at=shipment.created_at,
    )


def seller_shipment_read(shipment: "Shipment", events: list["OrderEvent"]) -> SellerShipmentRead:
    """The seller gets only the shipping details required to fulfil (§12.2)."""
    base = seller_shipment_list_item(shipment)
    return SellerShipmentRead(
        **base.model_dump(),
        items=[OrderItemRead.model_validate(i) for i in shipment.items],
        carrier=shipment.carrier,
        tracking_number=shipment.tracking_number,
        recipient_name=shipment.order.ship_recipient_name,
        ship_line1=shipment.order.ship_line1,
        ship_line2=shipment.order.ship_line2,
        ship_postal_code=shipment.order.ship_postal_code,
        ship_region=shipment.order.ship_region,
        events=[OrderEventRead.model_validate(e) for e in events],
    )
