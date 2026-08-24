from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class AdminUserListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime


class AdminUserUpdate(BaseModel):
    role: Literal[UserRole.BUYER, UserRole.SELLER, UserRole.ADMIN] | None = None
    is_active: bool | None = None
    reason: Annotated[str | None, Field(default=None, max_length=500)] = None


class AdminOrderListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    number: str
    status: str
    total_amount_minor: int
    currency: str
    seller_count: int
    buyer_id: str | None
    prescription_required: bool
    created_at: datetime


class AdminStats(BaseModel):
    pending_sellers: int
    pending_prescriptions: int
    orders_last_7d: int
    gmv_last_7d_minor: int
    currency: str
    active_products: int
    open_shipments: int


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    actor_id: str | None
    actor_role: str
    action: str
    subject_type: str
    subject_id: str
    created_at: datetime
