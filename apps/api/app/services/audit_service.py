"""Append-only audit trail for privileged actions (CLAUDE.md §12.3).

Entries carry IDs, never document contents, names, addresses, or health data.
"""

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import decode_cursor, encode_cursor
from app.models.infra import AuditLog

# Actions that must be audited. Adding one here is cheaper than remembering to.
PRESCRIPTION_VIEWED = "prescription.viewed"
PRESCRIPTION_REVIEWED = "prescription.reviewed"
SELLER_VERIFICATION_CHANGED = "seller.verification_changed"
ORDER_STATE_CHANGED_BY_ADMIN = "order.state_changed_by_admin"
REFUND_ISSUED = "order.refund_issued"
USER_ROLE_CHANGED = "user.role_changed"
USER_DEACTIVATED = "user.deactivated"


async def record(
    session: AsyncSession,
    *,
    actor_id: str | None,
    actor_role: str,
    action: str,
    subject_type: str,
    subject_id: str,
    ip_address: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    """Write an audit entry inside the caller's transaction.

    Must be called inside an existing transaction — the entry commits with the
    action it describes, so the two can never disagree.
    """
    entry = AuditLog(
        actor_id=actor_id,
        actor_role=actor_role,
        action=action,
        subject_type=subject_type,
        subject_id=subject_id,
        ip_address=ip_address,
        metadata_json=metadata or {},
    )
    session.add(entry)
    return entry


async def list_entries(
    session: AsyncSession,
    *,
    action: str | None = None,
    subject_id: str | None = None,
    limit: int = 50,
    cursor: str | None = None,
) -> tuple[list[AuditLog], str | None]:
    stmt = select(AuditLog).order_by(AuditLog.id.desc())
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if subject_id:
        stmt = stmt.where(AuditLog.subject_id == subject_id)
    if cursor and (decoded := decode_cursor(cursor)):
        stmt = stmt.where(AuditLog.id < decoded[1])

    rows = list((await session.execute(stmt.limit(limit + 1))).scalars())
    next_cursor = encode_cursor(None, rows[limit - 1].id) if len(rows) > limit else None
    return rows[:limit], next_cursor
