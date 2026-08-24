"""Password hashing and JWT issuing/decoding.

Kept free of FastAPI imports so it can be unit-tested in isolation.
"""

from datetime import UTC, datetime, timedelta
from typing import Any, Literal

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

TokenType = Literal["access", "refresh"]


def hash_password(password: str) -> str:
    return str(pwd_context.hash(password))


def verify_password(plain: str, hashed: str) -> bool:
    return bool(pwd_context.verify(plain, hashed))


def create_token(subject: str, token_type: TokenType, role: str | None = None) -> str:
    now = datetime.now(UTC)
    if token_type == "access":
        expires = now + timedelta(minutes=settings.access_token_expire_minutes)
    else:
        expires = now + timedelta(days=settings.refresh_token_expire_days)

    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
    }
    if role is not None:
        payload["role"] = role
    return str(jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm))


def decode_token(token: str, expected_type: TokenType) -> dict[str, Any] | None:
    """Return the decoded claims, or None if the token is invalid/expired/wrong type."""
    try:
        claims = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None
    if claims.get("type") != expected_type:
        return None
    return dict(claims)
