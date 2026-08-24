"""Authentication and role gating.

Two distinct checks exist (CLAUDE.md §3.5). This module owns the *first* one —
authenticate the caller and gate on role. The second — does this actor own this
row — belongs in the service, because only the service knows the object graph.
"""

from collections.abc import Callable, Coroutine
from typing import Annotated, Any

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AuthenticationError, PermissionError_
from app.core.security import decode_token
from app.db.session import get_db
from app.models.enums import UserRole
from app.models.seller import Seller
from app.models.user import User

# auto_error=False so we raise our own AppError envelope instead of FastAPI's.
_bearer = HTTPBearer(auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    session: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)] = None,
) -> User:
    if credentials is None:
        raise AuthenticationError()
    claims = decode_token(credentials.credentials, "access")
    if claims is None:
        raise AuthenticationError("Sessiya muddati tugadi. Qaytadan kiring.")
    user = await session.get(User, claims["sub"])
    if user is None or not user.is_active:
        raise AuthenticationError()
    return user


async def get_optional_user(
    session: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)] = None,
) -> User | None:
    """For endpoints that serve guests and buyers alike (cart, checkout)."""
    if credentials is None:
        return None
    claims = decode_token(credentials.credentials, "access")
    if claims is None:
        return None
    user = await session.get(User, claims["sub"])
    return user if user and user.is_active else None


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]


def require_role(*roles: UserRole) -> Callable[..., Coroutine[Any, Any, User]]:
    """Router dependency: reject the wrong role with 403 before the service runs."""

    async def _guard(user: CurrentUser) -> User:
        if user.role not in {str(r) for r in roles}:
            raise PermissionError_()
        return user

    return _guard


RequireBuyer = Annotated[User, Depends(require_role(UserRole.BUYER))]
RequireAdmin = Annotated[User, Depends(require_role(UserRole.ADMIN))]
RequireSellerUser = Annotated[User, Depends(require_role(UserRole.SELLER))]


async def get_current_seller(session: DbSession, user: RequireSellerUser) -> Seller:
    """The seller profile attached to the authenticated seller account.

    The seller ID always comes from the token's user, never from the request
    (§3.5) — this is what makes ownership checks downstream trustworthy.
    """
    result = await session.execute(select(Seller).where(Seller.user_id == user.id))
    seller = result.scalar_one_or_none()
    if seller is None:
        raise PermissionError_("Sizda hali sotuvchi profili yo‘q.")
    return seller


CurrentSeller = Annotated[Seller, Depends(get_current_seller)]


def client_ip(request: Request) -> str | None:
    """Best-effort client IP for the audit log. Never used for authorization."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None
