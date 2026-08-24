"""S3-compatible `DocumentStore` (Cloudflare R2 or S3).

Objects are stored encrypted by us before upload; the bucket is private and the
only way to read one back is a presigned URL with a lifetime of minutes.
"""

import asyncio
from functools import lru_cache
from typing import Any

from app.core.config import settings
from app.storage.base import StorageError
from app.storage.crypto import decrypt, encrypt


@lru_cache
def _client() -> Any:
    try:
        import boto3  # imported lazily so local dev never needs the SDK
    except ImportError as exc:  # pragma: no cover - depends on the environment
        raise StorageError("boto3 is required for the S3 document store") from exc

    return boto3.client(
        "s3",
        endpoint_url=settings.storage_endpoint_url or None,
        aws_access_key_id=settings.storage_access_key_id or None,
        aws_secret_access_key=settings.storage_secret_access_key or None,
    )


class S3DocumentStore:
    async def put(self, key: str, data: bytes, content_type: str) -> None:
        await asyncio.to_thread(
            _client().put_object,
            Bucket=settings.storage_bucket,
            Key=key,
            Body=encrypt(data),
            ContentType=content_type,
        )

    async def get(self, key: str) -> bytes:
        def _read() -> bytes:
            obj = _client().get_object(Bucket=settings.storage_bucket, Key=key)
            return bytes(obj["Body"].read())

        return decrypt(await asyncio.to_thread(_read))

    async def delete(self, key: str) -> None:
        await asyncio.to_thread(_client().delete_object, Bucket=settings.storage_bucket, Key=key)

    async def presigned_url(self, key: str, expires_in: int) -> str:
        return await asyncio.to_thread(
            _client().generate_presigned_url,
            "get_object",
            Params={"Bucket": settings.storage_bucket, "Key": key},
            ExpiresIn=expires_in,
        )
