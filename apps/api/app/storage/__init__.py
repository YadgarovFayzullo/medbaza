"""Document storage. One factory decides which backend the app talks to."""

from functools import lru_cache

from app.core.config import settings
from app.storage.base import DocumentStore, StorageError
from app.storage.local import LocalDocumentStore
from app.storage.s3 import S3DocumentStore


@lru_cache
def get_document_store() -> DocumentStore:
    if settings.storage_endpoint_url:
        return S3DocumentStore()
    return LocalDocumentStore()


__all__ = ["DocumentStore", "StorageError", "get_document_store"]
