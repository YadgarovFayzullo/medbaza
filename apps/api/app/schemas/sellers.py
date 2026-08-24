from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import SellerStatus


class SellerApplication(BaseModel):
    business_name: Annotated[str, Field(min_length=2, max_length=255)]
    country: Annotated[str, Field(min_length=2, max_length=2)]
    contact_email: EmailStr
    description: Annotated[str | None, Field(default=None, max_length=4_000)] = None
    license_number: Annotated[str | None, Field(default=None, max_length=128)] = None
    tax_id: Annotated[str | None, Field(default=None, max_length=128)] = None
    certification_documents: list[str] = Field(default_factory=list)


class SellerUpdate(BaseModel):
    business_name: Annotated[str | None, Field(default=None, min_length=2, max_length=255)] = None
    description: Annotated[str | None, Field(default=None, max_length=4_000)] = None
    contact_email: EmailStr | None = None
    license_number: Annotated[str | None, Field(default=None, max_length=128)] = None
    tax_id: Annotated[str | None, Field(default=None, max_length=128)] = None


class SellerPublic(BaseModel):
    """Storefront view of a seller — no tax ID, no payout reference."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    business_name: str
    slug: str
    description: str | None
    country: str
    status: str
    verified: bool
    product_count: int = 0
    created_at: datetime


class SellerPrivate(SellerPublic):
    """The seller's own view of their account."""

    contact_email: EmailStr
    license_number: str | None
    tax_id: str | None
    certification_documents: list[str]
    rejection_reason: str | None
    payout_enabled: bool


class SellerAdminListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    business_name: str
    slug: str
    country: str
    contact_email: EmailStr
    status: str
    license_number: str | None
    certification_documents: list[str]
    product_count: int = 0
    created_at: datetime


class SellerVerificationRequest(BaseModel):
    status: Literal[SellerStatus.VERIFIED, SellerStatus.REJECTED, SellerStatus.SUSPENDED]
    reason: Annotated[str | None, Field(default=None, max_length=500)] = None


class SellerDashboardStats(BaseModel):
    active_listings: int
    draft_listings: int
    out_of_stock: int
    low_stock: int
    open_shipments: int
    shipped_last_30d: int
    revenue_last_30d_minor: int
    pending_payout_minor: int
    currency: str


class PayoutStatusRead(BaseModel):
    payouts_enabled: bool
    on_hold: bool
    requirements_outstanding: list[str]
    # Present only while CLAUDE.md §4 is open: no provider is wired up yet.
    provider: str


class InventoryAdjustment(BaseModel):
    product_id: str
    stock: Annotated[int, Field(ge=0)]
