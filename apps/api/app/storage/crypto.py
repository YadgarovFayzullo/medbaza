"""Envelope encryption for documents at rest.

The key comes from `PRESCRIPTION_ENCRYPTION_KEY` — never a constant, never a
committed fixture (CLAUDE.md non-negotiable #10).
"""

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings
from app.storage.base import StorageError


def _fernet() -> Fernet:
    key = settings.prescription_encryption_key
    if not key:
        if settings.is_production:
            raise StorageError("PRESCRIPTION_ENCRYPTION_KEY is not configured")
        # Dev-only: derive a stable throwaway key so uploads work out of the box.
        digest = hashlib.sha256(f"dev-only::{settings.secret_key}".encode()).digest()
        key = base64.urlsafe_b64encode(digest).decode()
    try:
        return Fernet(key)
    except (ValueError, TypeError) as exc:
        raise StorageError("PRESCRIPTION_ENCRYPTION_KEY is not a valid Fernet key") from exc


def encrypt(data: bytes) -> bytes:
    return _fernet().encrypt(data)


def decrypt(token: bytes) -> bytes:
    try:
        return _fernet().decrypt(token)
    except InvalidToken as exc:
        raise StorageError("stored document could not be decrypted") from exc
