"""Prescription upload, review, and controlled access.

The document bytes never appear in a log line, a response body, a job argument,
or a URL (CLAUDE.md §5.5/§12.2). Only the owning buyer and admins may reach a
prescription; sellers only ever learn that the gate is satisfied.
"""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import NotFoundError, PermissionError_, ValidationError
from app.core.pagination import decode_cursor, encode_cursor
from app.db.base import uuid7
from app.models.enums import PrescriptionStatus, UserRole
from app.models.prescription import Prescription
from app.services import audit_service, outbox_service
from app.storage import get_document_store

ALLOWED_CONTENT_TYPES = frozenset({"application/pdf", "image/jpeg", "image/png", "image/heic"})
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


async def upload(
    session: AsyncSession,
    *,
    user_id: str,
    filename: str,
    content_type: str,
    data: bytes,
) -> Prescription:
    """Store an uploaded prescription and record its metadata.

    Must be called inside an existing transaction. The object key is opaque and
    carries no patient information.
    """
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationError(
            "PDF yoki rasm (JPEG, PNG yoki HEIC) yuklang.", details={"field": "file"}
        )
    if not data:
        raise ValidationError("Yuklangan fayl bo‘sh.", details={"field": "file"})
    if len(data) > MAX_UPLOAD_BYTES:
        raise ValidationError(
            "Retsept hajmi 10 MB dan kichik bo‘lishi kerak.", details={"field": "file"}
        )

    # Key is derived from random IDs only — never the filename or the buyer's name.
    object_key = f"prescriptions/{user_id}/{uuid7()}"
    await get_document_store().put(object_key, data, content_type)

    prescription = Prescription(
        user_id=user_id,
        object_key=object_key,
        content_type=content_type,
        byte_size=len(data),
        original_filename=filename[:255],
        status=PrescriptionStatus.PENDING_REVIEW,
    )
    session.add(prescription)
    await outbox_service.emit(
        session, outbox_service.PRESCRIPTION_SUBMITTED, {"prescription_id": prescription.id}
    )
    await session.flush()
    return prescription


async def list_for_user(
    session: AsyncSession, user_id: str, *, limit: int = 20, cursor: str | None = None
) -> tuple[list[Prescription], str | None]:
    stmt = (
        select(Prescription).where(Prescription.user_id == user_id).order_by(Prescription.id.desc())
    )
    if cursor and (decoded := decode_cursor(cursor)):
        stmt = stmt.where(Prescription.id < decoded[1])
    rows = list((await session.execute(stmt.limit(limit + 1))).scalars())
    next_cursor = encode_cursor(None, rows[limit - 1].id) if len(rows) > limit else None
    return rows[:limit], next_cursor


async def get_for_actor(
    session: AsyncSession, prescription_id: str, *, actor_id: str, actor_role: str
) -> Prescription:
    """Access is the owning buyer or an admin — nobody else, sellers included."""
    prescription = await session.get(Prescription, prescription_id)
    if prescription is None:
        raise NotFoundError("Bunday retsept mavjud emas.")
    if actor_role == UserRole.ADMIN:
        return prescription
    if prescription.user_id != actor_id:
        # Do not confirm that someone else's prescription exists (§3.5).
        raise NotFoundError("Bunday retsept mavjud emas.")
    return prescription


async def issue_download_link(
    session: AsyncSession,
    *,
    prescription_id: str,
    actor_id: str,
    actor_role: str,
    ip_address: str | None = None,
) -> tuple[str, int]:
    """Return a presigned URL valid for minutes, and audit the issuance (§5.5)."""
    prescription = await get_for_actor(
        session, prescription_id, actor_id=actor_id, actor_role=actor_role
    )
    ttl = settings.presigned_url_ttl_seconds
    url = await get_document_store().presigned_url(prescription.object_key, ttl)
    await audit_service.record(
        session,
        actor_id=actor_id,
        actor_role=actor_role,
        action=audit_service.PRESCRIPTION_VIEWED,
        subject_type="prescription",
        subject_id=prescription.id,
        ip_address=ip_address,
        metadata={"ttl_seconds": ttl},
    )
    return url, ttl


async def review(
    session: AsyncSession,
    *,
    prescription_id: str,
    status: str,
    reason: str | None,
    admin: Any,
    ip_address: str | None = None,
) -> Prescription:
    """Approve or reject. Only an admin may transition (§5.5)."""
    if admin.role != UserRole.ADMIN:
        raise PermissionError_()
    prescription = await session.get(Prescription, prescription_id)
    if prescription is None:
        raise NotFoundError("Bunday retsept mavjud emas.")
    if prescription.status != PrescriptionStatus.PENDING_REVIEW:
        raise ValidationError(
            "Bu retsept allaqachon ko‘rib chiqilgan.",
            code="ALREADY_REVIEWED",
            status=409,
            details={"prescription_id": prescription.id},
        )
    if status == PrescriptionStatus.REJECTED and not reason:
        raise ValidationError(
            "Rad etish uchun xaridor tushunadigan sabab kerak.", details={"field": "reason"}
        )

    prescription.status = status
    prescription.rejection_reason = reason if status == PrescriptionStatus.REJECTED else None
    prescription.reviewed_by_id = admin.id
    prescription.reviewed_at = datetime.now(UTC)

    await audit_service.record(
        session,
        actor_id=admin.id,
        actor_role=UserRole.ADMIN,
        action=audit_service.PRESCRIPTION_REVIEWED,
        subject_type="prescription",
        subject_id=prescription.id,
        ip_address=ip_address,
        metadata={"status": status},
    )
    await outbox_service.emit(
        session,
        outbox_service.PRESCRIPTION_REVIEWED,
        {"prescription_id": prescription.id, "status": status},
    )
    await session.flush()
    return prescription


async def list_pending(
    session: AsyncSession, *, limit: int = 20, cursor: str | None = None
) -> tuple[list[Prescription], str | None]:
    stmt = (
        select(Prescription)
        .where(Prescription.status == PrescriptionStatus.PENDING_REVIEW)
        .order_by(Prescription.id.asc())
    )
    if cursor and (decoded := decode_cursor(cursor)):
        stmt = stmt.where(Prescription.id > decoded[1])
    rows = list((await session.execute(stmt.limit(limit + 1))).scalars())
    next_cursor = encode_cursor(None, rows[limit - 1].id) if len(rows) > limit else None
    return rows[:limit], next_cursor
