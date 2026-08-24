from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.catalog import SellerSummary


class CartItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str
    product_name: str
    product_slug: str
    image_url: str | None
    quantity: int
    unit_amount_minor: int
    line_amount_minor: int
    currency: str
    prescription_required: bool
    # Server is authoritative on stock; the client reconciles against this.
    stock_available: int
    in_stock: bool
    seller: SellerSummary


class CartSellerGroup(BaseModel):
    """Items grouped the way they will be split into shipments at checkout."""

    seller: SellerSummary
    items: list[CartItemRead]
    subtotal_amount_minor: int


class CartRead(BaseModel):
    id: str
    currency: str
    groups: list[CartSellerGroup]
    item_count: int
    items_amount_minor: int
    shipping_amount_minor: int
    total_amount_minor: int
    prescription_required: bool
    # Populated when a line no longer matches the catalog (price or stock moved).
    # Always present, even when empty.
    warnings: list[str]


class CartItemAdd(BaseModel):
    product_id: str
    quantity: Annotated[int, Field(default=1, ge=1, le=999)] = 1


class CartItemUpdate(BaseModel):
    quantity: Annotated[int, Field(ge=0, le=999)]
