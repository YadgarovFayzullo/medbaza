"""Declarative base, ID generation, and shared column mixins."""

import os
import time
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import DateTime, String, func
from sqlalchemy import types as sa_types
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import TypeDecorator


def _utcnow() -> datetime:
    return datetime.now(UTC)


def uuid7() -> str:
    """Time-ordered UUIDv7 as a string (CLAUDE.md §6).

    Time-ordered IDs keep primary-key inserts sequential and give cursor
    pagination a natural, stable sort key.
    """
    unix_ms = int(time.time() * 1000)
    rand = int.from_bytes(os.urandom(10), "big")
    value = (unix_ms & 0xFFFFFFFFFFFF) << 80
    value |= 0x7 << 76  # version 7
    value |= ((rand >> 66) & 0xFFF) << 64
    value |= 0b10 << 62  # RFC 4122 variant
    value |= rand & 0x3FFFFFFFFFFFFFFF
    return str(uuid.UUID(int=value))


class CaseInsensitiveText(TypeDecorator[str]):
    """`citext` on Postgres, plain text elsewhere.

    Email uniqueness has to be case-insensitive (CLAUDE.md §7). Declaring the
    type here — rather than patching it in a migration — keeps the model and
    the database in agreement, so `--autogenerate` stops proposing to undo it.
    """

    impl = String
    cache_ok = True

    def __init__(self, length: int) -> None:
        super().__init__(length=length)
        self.length = length

    def load_dialect_impl(self, dialect: Any) -> Any:
        if dialect.name == "postgresql":
            return dialect.type_descriptor(CITEXT())
        return dialect.type_descriptor(String(self.length))


class CITEXT(sa_types.UserDefinedType[str]):
    """The Postgres `citext` type, enabled by the initial migration."""

    cache_ok = True

    def get_col_spec(self, **_: Any) -> str:
        return "CITEXT"


class Base(DeclarativeBase):
    """Base for all ORM models."""


class UUIDPrimaryKey:
    """String UUIDv7 primary key — portable across Postgres and SQLite (tests)."""

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid7)


class Timestamped:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=_utcnow,
        onupdate=_utcnow,
        nullable=False,
    )
