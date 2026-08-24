from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole

Password = Annotated[str, Field(min_length=10, max_length=128)]


class RegisterRequest(BaseModel):
    email: EmailStr
    password: Password
    full_name: Annotated[str, Field(min_length=1, max_length=255)]
    phone: Annotated[str | None, Field(default=None, max_length=32)] = None
    # A caller may only ever register as a buyer or a seller applicant.
    # `role` from a request body is never trusted for anything else (§3.5).
    role: Literal[UserRole.BUYER, UserRole.SELLER] = UserRole.BUYER


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    phone: str | None
    role: str
    is_active: bool


class SessionRead(BaseModel):
    """What the frontend needs after a login or refresh."""

    user: UserRead
    tokens: TokenPair
