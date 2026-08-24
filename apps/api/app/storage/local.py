"""Filesystem-backed `DocumentStore` for local development and tests.

Writes ciphertext under a gitignored directory and issues signed, expiring
URLs served by the API itself, so the prescription flow behaves the same way it
will against a real private bucket.
"""

import asyncio
import hashlib
import hmac
import time
from pathlib import Path

from app.core.config import settings
from app.storage.base import StorageError
from app.storage.crypto import decrypt, encrypt

_ROOT = Path(".storage")


def _path(key: str) -> Path:
    if ".." in key or key.startswith("/"):
        raise StorageError("invalid object key")
    return _ROOT / key


def sign_key(key: str, expires_at: int) -> str:
    mac = hmac.new(settings.secret_key.encode(), f"{key}:{expires_at}".encode(), hashlib.sha256)
    return mac.hexdigest()


def verify_signature(key: str, expires_at: int, signature: str) -> bool:
    if expires_at < int(time.time()):
        return False
    return hmac.compare_digest(sign_key(key, expires_at), signature)


class LocalDocumentStore:
    """Not for production — `STORAGE_ENDPOINT_URL` selects the S3 store instead."""

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        path = _path(key)
        await asyncio.to_thread(path.parent.mkdir, parents=True, exist_ok=True)
        await asyncio.to_thread(path.write_bytes, encrypt(data))

    async def get(self, key: str) -> bytes:
        path = _path(key)
        if not path.exists():
            raise StorageError("document not found")
        return decrypt(await asyncio.to_thread(path.read_bytes))

    async def delete(self, key: str) -> None:
        await asyncio.to_thread(_path(key).unlink, True)

    async def presigned_url(self, key: str, expires_in: int) -> str:
        expires_at = int(time.time()) + expires_in
        signature = sign_key(key, expires_at)
        return (
            f"{settings.api_v1_prefix}/prescriptions/download"
            f"?key={key}&expires={expires_at}&signature={signature}"
        )
