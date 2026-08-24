"""Object-storage port for sensitive documents.

Buckets are private. Bytes are encrypted before they leave this process and
are only ever handed back through a short-lived presigned URL (CLAUDE.md §5.5).
"""

from typing import Protocol, runtime_checkable


@runtime_checkable
class DocumentStore(Protocol):
    async def put(self, key: str, data: bytes, content_type: str) -> None: ...

    async def get(self, key: str) -> bytes: ...

    async def delete(self, key: str) -> None: ...

    async def presigned_url(self, key: str, expires_in: int) -> str: ...


class StorageError(Exception):
    """The document could not be written, read, or signed for."""
