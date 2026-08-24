"""Buyer account: profile and the saved address book."""

from fastapi import APIRouter, status
from sqlalchemy import select

from app.api.deps import Transaction
from app.auth import CurrentUser, DbSession
from app.core.errors import NotFoundError
from app.models.user import Address
from app.schemas.common import OkResponse
from app.schemas.orders import AddressCreate, AddressRead

router = APIRouter(prefix="/account", tags=["account"], dependencies=[Transaction])


@router.get("/addresses", response_model=list[AddressRead], operation_id="listAddresses")
async def list_addresses(session: DbSession, user: CurrentUser) -> list[AddressRead]:
    """The buyer's saved addresses. Scoped to the token's user."""
    rows = (
        await session.execute(
            select(Address)
            .where(Address.user_id == user.id)
            .order_by(Address.is_default.desc(), Address.id.desc())
        )
    ).scalars()
    return [AddressRead.model_validate(a) for a in rows]


@router.post(
    "/addresses",
    response_model=AddressRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="createAddress",
)
async def create_address(
    payload: AddressCreate, session: DbSession, user: CurrentUser
) -> AddressRead:
    """Save an address. Orders snapshot the address, so later edits never
    rewrite the shipping details of a past order (§7)."""
    if payload.is_default:
        for existing in (
            await session.execute(select(Address).where(Address.user_id == user.id))
        ).scalars():
            existing.is_default = False
    address = Address(user_id=user.id, **payload.model_dump())
    address.country = address.country.upper()
    session.add(address)
    await session.flush()
    return AddressRead.model_validate(address)


@router.delete("/addresses/{address_id}", response_model=OkResponse, operation_id="deleteAddress")
async def delete_address(address_id: str, session: DbSession, user: CurrentUser) -> OkResponse:
    """Remove a saved address."""
    address = await session.get(Address, address_id)
    # Someone else's address is reported as missing, never as forbidden (§3.5).
    if address is None or address.user_id != user.id:
        raise NotFoundError("Bunday manzil mavjud emas.")
    await session.delete(address)
    return OkResponse()
