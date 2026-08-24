"""Model package — importing it registers every table on `Base.metadata`."""

from app.models.cart import Cart, CartItem
from app.models.category import Category
from app.models.infra import AuditLog, IdempotencyKey, OutboxEvent, WebhookEvent
from app.models.order import Order, OrderEvent, OrderItem, Shipment
from app.models.prescription import Prescription
from app.models.product import Product
from app.models.review import Review
from app.models.seller import Seller
from app.models.user import Address, User

__all__ = [
    "Address",
    "AuditLog",
    "Cart",
    "CartItem",
    "Category",
    "IdempotencyKey",
    "Order",
    "OrderEvent",
    "OrderItem",
    "OutboxEvent",
    "Prescription",
    "Product",
    "Review",
    "Seller",
    "Shipment",
    "User",
    "WebhookEvent",
]
