"""Domain enums.

Stored as plain strings in the DB so adding a member never needs a Postgres
`ALTER TYPE`; validity is enforced by the Pydantic schemas and service layer.
"""

from enum import StrEnum


class UserRole(StrEnum):
    BUYER = "buyer"
    SELLER = "seller"
    ADMIN = "admin"


class SellerStatus(StrEnum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class ProductStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class Certification(StrEnum):
    CE = "CE"
    FDA = "FDA"
    ISO = "ISO"


class ShipmentStatus(StrEnum):
    """The authoritative per-seller state (CLAUDE.md §5.4)."""

    PENDING_PAYMENT = "pending_payment"
    PAYMENT_FAILED = "payment_failed"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURN_REQUESTED = "return_requested"
    RETURNED = "returned"
    REFUNDED = "refunded"


class OrderStatus(StrEnum):
    """Derived buyer-facing state — computed from shipments, never stored."""

    PENDING_PAYMENT = "pending_payment"
    PROCESSING = "processing"
    PARTIALLY_SHIPPED = "partially_shipped"
    SHIPPED = "shipped"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PrescriptionStatus(StrEnum):
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
