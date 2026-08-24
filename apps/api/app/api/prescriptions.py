"""Prescription upload and controlled access.

Document bytes never appear in a response body or a log line; downloads happen
through a short-lived presigned URL and every issuance is audited (§5.5).
"""

from fastapi import APIRouter, File, Query, Request, Response, UploadFile, status

from app.api.deps import Cursor, Limit, Transaction
from app.auth import CurrentUser, DbSession, client_ip
from app.core.errors import NotFoundError, PermissionError_
from app.schemas.common import Page
from app.schemas.prescriptions import PrescriptionDownloadLink, PrescriptionRead
from app.services import prescription_service
from app.storage import get_document_store
from app.storage.local import verify_signature

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"], dependencies=[Transaction])


@router.get("", response_model=Page[PrescriptionRead], operation_id="listPrescriptions")
async def list_prescriptions(
    session: DbSession, user: CurrentUser, limit: Limit = 20, cursor: Cursor = None
) -> Page[PrescriptionRead]:
    """The signed-in buyer's own prescriptions, metadata only."""
    rows, next_cursor = await prescription_service.list_for_user(
        session, user.id, limit=limit, cursor=cursor
    )
    return Page(items=[PrescriptionRead.model_validate(p) for p in rows], next_cursor=next_cursor)


@router.post(
    "",
    response_model=PrescriptionRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="uploadPrescription",
)
async def upload_prescription(
    session: DbSession, user: CurrentUser, file: UploadFile = File(...)
) -> PrescriptionRead:
    """Upload a prescription for review. Stored encrypted in a private bucket."""
    data = await file.read()
    prescription = await prescription_service.upload(
        session,
        user_id=user.id,
        filename=file.filename or "prescription",
        content_type=file.content_type or "application/octet-stream",
        data=data,
    )
    return PrescriptionRead.model_validate(prescription)


@router.get("/download", operation_id="downloadPrescriptionObject", include_in_schema=False)
async def download_object(
    key: str = Query(...), expires: int = Query(...), signature: str = Query(...)
) -> Response:
    """Serve a locally-stored document for a signed, unexpired URL.

    Only reachable with a signature minted by `issue_download_link`; against a
    real bucket the presigned URL points at the provider instead.
    """
    if not verify_signature(key, expires, signature):
        raise PermissionError_("Yuklab olish havolasining muddati tugagan.")
    try:
        data = await get_document_store().get(key)
    except Exception as exc:  # storage errors must not leak a driver message
        raise NotFoundError("Bu hujjat endi mavjud emas.") from exc
    return Response(
        content=data,
        media_type="application/octet-stream",
        headers={"Cache-Control": "no-store", "Content-Disposition": "attachment"},
    )


@router.get("/{prescription_id}", response_model=PrescriptionRead, operation_id="getPrescription")
async def get_prescription(
    prescription_id: str, session: DbSession, user: CurrentUser
) -> PrescriptionRead:
    """Metadata for one prescription the caller owns (or any, for an admin)."""
    prescription = await prescription_service.get_for_actor(
        session, prescription_id, actor_id=user.id, actor_role=user.role
    )
    return PrescriptionRead.model_validate(prescription)


@router.post(
    "/{prescription_id}/download-link",
    response_model=PrescriptionDownloadLink,
    operation_id="createPrescriptionDownloadLink",
)
async def create_download_link(
    prescription_id: str, request: Request, session: DbSession, user: CurrentUser
) -> PrescriptionDownloadLink:
    """Mint a single-use, minutes-long download URL. Issuance is audited."""
    url, ttl = await prescription_service.issue_download_link(
        session,
        prescription_id=prescription_id,
        actor_id=user.id,
        actor_role=user.role,
        ip_address=client_ip(request),
    )
    return PrescriptionDownloadLink(url=url, expires_in=ttl)
