"""Authentication routes."""

from fastapi import APIRouter, status

from app.api.deps import CartToken, Transaction
from app.auth import CurrentUser, DbSession
from app.core.errors import AuthenticationError
from app.core.security import decode_token
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    SessionRead,
    TokenPair,
    UserRead,
)
from app.services import auth_service, cart_service

router = APIRouter(prefix="/auth", tags=["auth"], dependencies=[Transaction])


def _session_payload(user: User, tokens: tuple[str, str, int]) -> SessionRead:
    access, refresh, expires_in = tokens
    return SessionRead(
        user=UserRead.model_validate(user),
        tokens=TokenPair(access_token=access, refresh_token=refresh, expires_in=expires_in),
    )


@router.post(
    "/register",
    response_model=SessionRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="register",
)
async def register(
    payload: RegisterRequest, session: DbSession, cart_token: CartToken = None
) -> SessionRead:
    """Create a buyer or seller-applicant account and sign the caller in."""
    user = await auth_service.register(
        session,
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        phone=payload.phone,
        role=payload.role,
    )
    if cart_token:
        await cart_service.claim_guest_cart(session, user_id=user.id, session_token=cart_token)
    return _session_payload(user, auth_service.issue_tokens(user))


@router.post("/login", response_model=SessionRead, operation_id="login")
async def login(
    payload: LoginRequest, session: DbSession, cart_token: CartToken = None
) -> SessionRead:
    """Exchange credentials for an access/refresh token pair.

    The response is identical whether or not the account exists (§12.1).
    """
    user = await auth_service.authenticate(session, email=payload.email, password=payload.password)
    if cart_token:
        await cart_service.claim_guest_cart(session, user_id=user.id, session_token=cart_token)
    return _session_payload(user, auth_service.issue_tokens(user))


@router.post("/refresh", response_model=SessionRead, operation_id="refreshSession")
async def refresh(payload: RefreshRequest, session: DbSession) -> SessionRead:
    """Rotate a refresh token for a new pair."""
    claims = decode_token(payload.refresh_token, "refresh")
    if claims is None:
        raise AuthenticationError("Sessiya muddati tugadi. Qaytadan kiring.")
    user = await auth_service.refresh_session(session, claims_subject=claims["sub"])
    return _session_payload(user, auth_service.issue_tokens(user))


@router.get("/me", response_model=UserRead, operation_id="getCurrentUser")
async def me(user: CurrentUser) -> UserRead:
    """The signed-in user's own profile."""
    return UserRead.model_validate(user)
