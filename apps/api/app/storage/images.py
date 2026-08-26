"""Public image storage for catalog photos (Cloudflare R2 or S3).

Deliberately **not** the `DocumentStore` in this package. That one holds
prescriptions: encrypted, private, reachable only through a presigned URL that
expires in minutes (§5.5, §12.2). A product photo is the opposite — it is served
to anonymous shoppers on ISR-cached pages, so it is stored unencrypted in a
public bucket and addressed by a stable URL. Mixing the two would either leak
health documents or make the catalog uncacheable.

Nothing here ever touches a prescription key.
"""

import asyncio
import re
import uuid
from functools import lru_cache
from pathlib import Path
from typing import Any, Protocol

from app.core.config import settings
from app.storage.base import StorageError

# Formats a browser renders and a phone camera produces. SVG is excluded on
# purpose: it is a script-bearing document, not a photo.
CONTENT_TYPES: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

MAX_IMAGE_BYTES = 5 * 1024 * 1024

_LOCAL_ROOT = Path(".storage/images")
_KEY = re.compile(r"^products/[0-9a-f-]+/[0-9a-f]{32}\.(jpg|png|webp)$")


class ImageStore(Protocol):
    async def put(self, key: str, data: bytes, content_type: str) -> None: ...

    async def delete(self, key: str) -> None: ...

    def public_url(self, key: str) -> str: ...


def build_key(product_id: str, content_type: str) -> str:
    """A collision-free key that carries no user-supplied filename."""
    extension = CONTENT_TYPES.get(content_type)
    if extension is None:
        raise StorageError(f"unsupported image type: {content_type}")
    return f"products/{product_id}/{uuid.uuid4().hex}.{extension}"


def is_managed_key(value: str) -> bool:
    """True for a key this store owns, false for a seeded or external URL."""
    return bool(_KEY.match(value))


def resolve_url(value: str) -> str:
    """Turn a stored image reference into something a browser can fetch.

    Rows hold a bare key for anything uploaded through this store, and the seed
    writes plain `/products/x.jpg` paths served by the web app. Absolute URLs
    and rooted paths pass through untouched, so the bucket's public hostname
    lives in configuration rather than being baked into every row.
    """
    if value.startswith(("http://", "https://", "/")):
        return value
    return f"{_public_base()}/{value}"


def _public_base() -> str:
    base = settings.image_public_base_url or f"{settings.api_base_url}/api/v1/media"
    return base.rstrip("/")


@lru_cache
def _client() -> Any:
    try:
        import boto3  # imported lazily so local dev never needs the SDK
    except ImportError as exc:  # pragma: no cover - depends on the environment
        raise StorageError("boto3 is required for the R2 image store") from exc

    return boto3.client(
        "s3",
        endpoint_url=settings.storage_endpoint_url or None,
        aws_access_key_id=settings.storage_access_key_id or None,
        aws_secret_access_key=settings.storage_secret_access_key or None,
    )


class R2ImageStore:
    """R2 exposes a bucket publicly through its own domain, not per-object ACLs,
    so nothing here sets one — `IMAGE_PUBLIC_BASE_URL` is that domain."""

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        await asyncio.to_thread(
            _client().put_object,
            Bucket=settings.image_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
            # Immutable: the key contains a uuid, so a changed photo is a new key.
            CacheControl="public, max-age=31536000, immutable",
        )

    async def delete(self, key: str) -> None:
        await asyncio.to_thread(_client().delete_object, Bucket=settings.image_bucket, Key=key)

    def public_url(self, key: str) -> str:
        return f"{_public_base()}/{key}"


class LocalImageStore:
    """Not for production — `STORAGE_ENDPOINT_URL` selects the R2 store instead."""

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        path = _local_path(key)
        await asyncio.to_thread(path.parent.mkdir, parents=True, exist_ok=True)
        await asyncio.to_thread(path.write_bytes, data)

    async def delete(self, key: str) -> None:
        path = _local_path(key)
        await asyncio.to_thread(path.unlink, True)

    def public_url(self, key: str) -> str:
        return f"{_public_base()}/{key}"


def _local_path(key: str) -> Path:
    if not is_managed_key(key):
        raise StorageError("invalid image key")
    return _LOCAL_ROOT / key


def local_path_for(key: str) -> Path:
    """Used by the dev-only media route that stands in for the public bucket."""
    return _local_path(key)


@lru_cache
def get_image_store() -> ImageStore:
    if settings.storage_endpoint_url:
        return R2ImageStore()
    return LocalImageStore()


__all__ = [
    "CONTENT_TYPES",
    "MAX_IMAGE_BYTES",
    "ImageStore",
    "build_key",
    "get_image_store",
    "is_managed_key",
    "local_path_for",
    "resolve_url",
]
