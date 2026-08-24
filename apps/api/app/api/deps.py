"""Shared router dependencies: transactions, pagination, and request headers."""

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import DbSession
from app.core.errors import ValidationError


async def transaction(session: DbSession) -> AsyncGenerator[AsyncSession, None]:
    """One request, one transaction (CLAUDE.md §3.3).

    Commits once the handler has returned successfully; rolls back on any raised
    exception. Services never call `commit()` themselves.
    """
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise


Transaction = Depends(transaction)

Limit = Annotated[int, Query(ge=1, le=100, description="Page size.")]
Cursor = Annotated[str | None, Query(description="Opaque cursor from the previous page.")]

CartToken = Annotated[
    str | None,
    Header(
        alias="X-Cart-Token",
        description="Opaque guest-cart token. Ignored once the caller is signed in.",
    ),
]


def idempotency_key(
    value: Annotated[
        str | None,
        Header(alias="Idempotency-Key", description="Client-generated key; retries reuse it."),
    ] = None,
) -> str:
    """Required on checkout so a retried request cannot create a second order (§5.6)."""
    if not value or len(value) < 8:
        raise ValidationError(
            "Kamida 8 belgidan iborat Idempotency-Key sarlavhasi talab qilinadi.",
            code="IDEMPOTENCY_KEY_REQUIRED",
            status=400,
            details={"header": "Idempotency-Key"},
        )
    return value


IdempotencyKey = Annotated[str, Depends(idempotency_key)]
