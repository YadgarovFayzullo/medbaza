"""Development stand-in for the public image bucket.

In production `IMAGE_PUBLIC_BASE_URL` points at R2's own domain and this router
is never reached. Locally there is no bucket, so the API serves the same bytes
from disk under the same path shape.

Catalog photos only. Prescriptions are encrypted, private, and served through
their own audited presigned-URL route — never from here (§5.5).
"""

from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.core.errors import NotFoundError
from app.storage import images

router = APIRouter(prefix="/media", tags=["media"])

_MEDIA_TYPES = {"jpg": "image/jpeg", "png": "image/png", "webp": "image/webp"}


@router.get("/products/{product_id}/{filename}", operation_id="getProductImage")
async def get_product_image(product_id: str, filename: str) -> FileResponse:
    """Serve a catalog photo from local storage. Public by design."""
    key = f"products/{product_id}/{filename}"
    if not images.is_managed_key(key):
        raise NotFoundError("Rasm topilmadi.")

    path = images.local_path_for(key)
    if not path.is_file():
        raise NotFoundError("Rasm topilmadi.")

    return FileResponse(
        path,
        media_type=_MEDIA_TYPES[filename.rsplit(".", 1)[-1]],
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
