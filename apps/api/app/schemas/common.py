"""Shared response envelopes and query models."""

from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field

Cursor = Annotated[str | None, Field(default=None, description="Opaque cursor from `next_cursor`.")]
Limit = Annotated[int, Field(default=24, ge=1, le=100)]


class Page[T](BaseModel):
    """Cursor-paginated list. No offsets — the catalog changes under the reader."""

    items: list[T]
    next_cursor: str | None = Field(
        default=None, description="Pass back as `?cursor=` to fetch the next page."
    )


class Money(BaseModel):
    """Money on the wire is always minor units plus an ISO-4217 code."""

    model_config = ConfigDict(from_attributes=True)

    amount_minor: int
    currency: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict[str, Any] = Field(default_factory=dict)
    request_id: str


class ErrorResponse(BaseModel):
    """The fixed error envelope every failing endpoint returns."""

    error: ErrorBody


class OkResponse(BaseModel):
    ok: bool = True
