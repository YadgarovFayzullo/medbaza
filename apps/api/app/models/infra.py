"""Cross-cutting tables: outbox, audit log, idempotency, webhook dedupe."""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, Timestamped, UUIDPrimaryKey


class OutboxEvent(UUIDPrimaryKey, Timestamped, Base):
    """Transactional outbox (CLAUDE.md §3.6).

    Services insert a row inside the request transaction; a poller enqueues the
    job afterwards and stamps `dispatched_at`. Payload is IDs and primitives
    only — never PHI, never a nested object graph.
    """

    __tablename__ = "outbox_events"

    event_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    dispatched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_error: Mapped[str | None] = mapped_column(Text)


class AuditLog(UUIDPrimaryKey, Timestamped, Base):
    """Append-only record of privileged actions (CLAUDE.md §12.3).

    Never contains document contents — subject IDs only.
    """

    __tablename__ = "audit_logs"

    actor_id: Mapped[str | None] = mapped_column(String(36), index=True)
    actor_role: Mapped[str] = mapped_column(String(16), default="system", nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    subject_type: Mapped[str] = mapped_column(String(64), nullable=False)
    subject_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    ip_address: Mapped[str | None] = mapped_column(String(45))
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)


class IdempotencyKey(UUIDPrimaryKey, Timestamped, Base):
    """Replay guard for `POST /checkout` (CLAUDE.md §5.6)."""

    __tablename__ = "idempotency_keys"
    __table_args__ = (UniqueConstraint("key", "endpoint", name="uq_idempotency_key_endpoint"),)

    key: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    endpoint: Mapped[str] = mapped_column(String(128), nullable=False)
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    response_json: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class WebhookEvent(UUIDPrimaryKey, Timestamped, Base):
    """Provider event dedupe table — the unique index *is* the guarantee."""

    __tablename__ = "webhook_events"
    __table_args__ = (
        UniqueConstraint("provider", "provider_event_id", name="uq_webhook_provider_event"),
    )

    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    provider_event_id: Mapped[str] = mapped_column(String(255), nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    received_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
