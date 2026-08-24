"""Registration, login, and token refresh.

Responses are deliberately identical whether or not an account exists, so the
API cannot be used to enumerate email addresses (CLAUDE.md §12.1).
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import (
    AuthenticationError,
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
)
from app.core.security import create_token, hash_password, verify_password
from app.models.enums import UserRole
from app.models.user import User


def _normalise_email(email: str) -> str:
    return email.strip().lower()


async def get_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(
        select(User).where(func.lower(User.email) == _normalise_email(email))
    )
    return result.scalar_one_or_none()


async def register(
    session: AsyncSession,
    *,
    email: str,
    password: str,
    full_name: str,
    phone: str | None = None,
    role: str = UserRole.BUYER,
) -> User:
    """Create a buyer or seller-applicant account.

    A seller account still has to be verified by an admin before it can list
    anything — the role alone grants nothing (§5.5, §12.3).
    """
    if role not in {UserRole.BUYER, UserRole.SELLER}:
        # Admins are provisioned out of band, never through a public endpoint.
        raise AuthenticationError("Bu rolni o‘zingizga bera olmaysiz.")
    if await get_by_email(session, email) is not None:
        raise EmailAlreadyRegisteredError()

    user = User(
        email=_normalise_email(email),
        hashed_password=hash_password(password),
        full_name=full_name.strip(),
        phone=phone,
        role=role,
    )
    session.add(user)
    await session.flush()
    return user


async def authenticate(session: AsyncSession, *, email: str, password: str) -> User:
    user = await get_by_email(session, email)
    if user is None:
        # Hash anyway so a missing account is not distinguishable by timing.
        verify_password(password, hash_password("timing-equaliser"))
        raise InvalidCredentialsError()
    if not verify_password(password, user.hashed_password) or not user.is_active:
        raise InvalidCredentialsError()
    return user


def issue_tokens(user: User) -> tuple[str, str, int]:
    """Return `(access_token, refresh_token, access_ttl_seconds)`."""
    access = create_token(user.id, "access", role=user.role)
    refresh = create_token(user.id, "refresh", role=user.role)
    return access, refresh, settings.access_token_expire_minutes * 60


async def refresh_session(session: AsyncSession, *, claims_subject: str) -> User:
    user = await session.get(User, claims_subject)
    if user is None or not user.is_active:
        raise AuthenticationError("Sessiyangiz endi yaroqli emas.")
    return user
