from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PrescriptionStatus


class PrescriptionRead(BaseModel):
    """Metadata only. The document itself is reachable solely through a
    short-lived presigned URL, and every issuance is audited (§5.5)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    original_filename: str
    content_type: str
    byte_size: int
    status: str
    rejection_reason: str | None
    reviewed_at: datetime | None
    created_at: datetime


class PrescriptionAdminListItem(PrescriptionRead):
    # An admin needs to know whose it is; the buyer's identity is an ID here.
    user_id: str


class PrescriptionReviewRequest(BaseModel):
    status: Literal[PrescriptionStatus.APPROVED, PrescriptionStatus.REJECTED]
    reason: Annotated[str | None, Field(default=None, max_length=500)] = None


class PrescriptionDownloadLink(BaseModel):
    url: str
    expires_in: int
