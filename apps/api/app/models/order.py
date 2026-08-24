from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Timestamped, UUIDPrimaryKey
from app.models.enums import OrderStatus, ShipmentStatus

if TYPE_CHECKING:
    from app.models.prescription import Prescription
    from app.models.seller import Seller
    from app.models.user import User


class Order(UUIDPrimaryKey, Timestamped, Base):
    """The buyer-facing purchase: one payment, one currency, one address.

    `status` is *derived* from the order's shipments (CLAUDE.md §5.4) — it is
    never assigned directly.
    """

    __tablename__ = "orders"

    number: Mapped[str] = mapped_column(String(24), unique=True, index=True, nullable=False)

    buyer_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    # Guest checkout: contact address for the order, never used to look up a user.
    guest_email: Mapped[str | None] = mapped_column(String(255))

    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    items_amount_minor: Mapped[int] = mapped_column(Integer, nullable=False)
    shipping_amount_minor: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tax_amount_minor: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_amount_minor: Mapped[int] = mapped_column(Integer, nullable=False)

    # Address snapshot — never a live FK to a mutable address-book row (§7).
    ship_recipient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    ship_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    ship_line2: Mapped[str | None] = mapped_column(String(255))
    ship_city: Mapped[str] = mapped_column(String(128), nullable=False)
    ship_region: Mapped[str | None] = mapped_column(String(128))
    ship_postal_code: Mapped[str] = mapped_column(String(32), nullable=False)
    ship_country: Mapped[str] = mapped_column(String(2), nullable=False)
    ship_phone: Mapped[str | None] = mapped_column(String(32))

    # Opaque provider reference — no PSP semantics are assumed about its shape (§3.7).
    payment_ref: Mapped[str | None] = mapped_column(String(255), index=True)

    prescription_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    prescription_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("prescriptions.id", ondelete="SET NULL")
    )

    buyer: Mapped["User | None"] = relationship(back_populates="orders")
    prescription: Mapped["Prescription | None"] = relationship(foreign_keys=[prescription_id])
    shipments: Mapped[list["Shipment"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )
    events: Mapped[list["OrderEvent"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )

    @property
    def status(self) -> str:
        """Derived buyer-facing status. See CLAUDE.md §5.4."""
        statuses = {s.status for s in self.shipments}
        if not statuses:
            return OrderStatus.PENDING_PAYMENT
        if statuses <= {ShipmentStatus.CANCELLED, ShipmentStatus.PAYMENT_FAILED}:
            return OrderStatus.CANCELLED
        if statuses <= {ShipmentStatus.REFUNDED, ShipmentStatus.RETURNED}:
            return OrderStatus.REFUNDED
        live = statuses - {ShipmentStatus.CANCELLED, ShipmentStatus.REFUNDED}
        if ShipmentStatus.PENDING_PAYMENT in live:
            return OrderStatus.PENDING_PAYMENT
        if live <= {ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED}:
            return OrderStatus.COMPLETED
        if live & {ShipmentStatus.SHIPPED, ShipmentStatus.DELIVERED}:
            return (
                OrderStatus.SHIPPED
                if live <= {ShipmentStatus.SHIPPED, ShipmentStatus.DELIVERED}
                else OrderStatus.PARTIALLY_SHIPPED
            )
        return OrderStatus.PROCESSING


class Shipment(UUIDPrimaryKey, Timestamped, Base):
    """Per-seller fulfilment group — the seller-facing unit of work."""

    __tablename__ = "shipments"

    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False
    )
    seller_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sellers.id", ondelete="RESTRICT"), index=True, nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(24), default=ShipmentStatus.PENDING_PAYMENT, nullable=False, index=True
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    items_amount_minor: Mapped[int] = mapped_column(Integer, nullable=False)
    shipping_amount_minor: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Platform's cut of this shipment; the seller payout is the remainder.
    platform_fee_amount_minor: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    carrier: Mapped[str | None] = mapped_column(String(64))
    tracking_number: Mapped[str | None] = mapped_column(String(128))

    order: Mapped["Order"] = relationship(back_populates="shipments")
    seller: Mapped["Seller"] = relationship()
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="shipment", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def total_amount_minor(self) -> int:
        return self.items_amount_minor + self.shipping_amount_minor

    @property
    def seller_payout_amount_minor(self) -> int:
        return self.total_amount_minor - self.platform_fee_amount_minor


class OrderItem(UUIDPrimaryKey, Timestamped, Base):
    """A purchased line. Every display field is a snapshot taken at order time —
    historical orders never join back to `Product` (CLAUDE.md §5.2)."""

    __tablename__ = "order_items"
    __table_args__ = (CheckConstraint("quantity > 0", name="ck_order_items_quantity_positive"),)

    shipment_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("shipments.id", ondelete="CASCADE"), index=True, nullable=False
    )
    # Kept for reordering and review eligibility only — never for display.
    product_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="SET NULL"), index=True
    )
    seller_id: Mapped[str] = mapped_column(String(36), nullable=False)

    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_slug: Mapped[str] = mapped_column(String(280), nullable=False)
    sku: Mapped[str] = mapped_column(String(64), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(512))
    prescription_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_amount_minor: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)

    shipment: Mapped["Shipment"] = relationship(back_populates="items")

    @property
    def line_amount_minor(self) -> int:
        return self.unit_amount_minor * self.quantity


class OrderEvent(UUIDPrimaryKey, Timestamped, Base):
    """Append-only transition log — the basis for buyer-facing tracking."""

    __tablename__ = "order_events"

    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False
    )
    shipment_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("shipments.id", ondelete="CASCADE"), index=True
    )
    actor_id: Mapped[str | None] = mapped_column(String(36))
    actor_role: Mapped[str] = mapped_column(String(16), default="system", nullable=False)
    from_status: Mapped[str | None] = mapped_column(String(24))
    to_status: Mapped[str] = mapped_column(String(24), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)

    order: Mapped["Order"] = relationship(back_populates="events")
