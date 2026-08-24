"""Cart routes. Serve guests and signed-in buyers through the same shapes."""

from fastapi import APIRouter, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CartToken, Transaction
from app.auth import DbSession, OptionalUser
from app.models.cart import Cart
from app.models.user import User
from app.schemas.cart import CartItemAdd, CartItemRead, CartItemUpdate, CartRead, CartSellerGroup
from app.schemas.catalog import SellerSummary
from app.services import cart_service

router = APIRouter(prefix="/cart", tags=["cart"], dependencies=[Transaction])

# Lets a guest keep their cart across requests without a login.
CART_TOKEN_HEADER = "X-Cart-Token"


def _view(cart: Cart) -> CartRead:
    summary = cart_service.summarise(cart)
    groups = [
        CartSellerGroup(
            seller=SellerSummary.model_validate(group["seller"]),
            subtotal_amount_minor=group["subtotal_amount_minor"],
            items=[
                CartItemRead(
                    id=item.id,
                    product_id=item.product_id,
                    product_name=item.product.name,
                    product_slug=item.product.slug,
                    image_url=item.product.image_url,
                    quantity=item.quantity,
                    unit_amount_minor=item.product.price_amount_minor,
                    line_amount_minor=item.product.price_amount_minor * item.quantity,
                    currency=item.product.currency,
                    prescription_required=item.product.prescription_required,
                    stock_available=item.product.stock,
                    in_stock=item.product.stock >= item.quantity,
                    seller=SellerSummary.model_validate(group["seller"]),
                )
                for item in group["items"]
            ],
        )
        for group in summary["groups"]
    ]
    return CartRead(
        id=cart.id,
        currency=summary["currency"],
        groups=groups,
        item_count=summary["item_count"],
        items_amount_minor=summary["items_amount_minor"],
        shipping_amount_minor=summary["shipping_amount_minor"],
        total_amount_minor=summary["total_amount_minor"],
        prescription_required=summary["prescription_required"],
        warnings=summary["warnings"],
    )


async def _resolve(
    session: AsyncSession, user: User | None, cart_token: str | None, response: Response
) -> Cart:
    cart = await cart_service.get_or_create_cart(
        session, user_id=user.id if user else None, session_token=cart_token
    )
    if cart.session_token and not cart.user_id:
        # Echo the token back so a guest client can persist it.
        response.headers[CART_TOKEN_HEADER] = cart.session_token
    return cart


@router.get("", response_model=CartRead, operation_id="getCart")
async def get_cart(
    session: DbSession, response: Response, user: OptionalUser = None, cart_token: CartToken = None
) -> CartRead:
    """The caller's cart with server-computed totals, grouped by seller."""
    return _view(await _resolve(session, user, cart_token, response))


@router.post(
    "/items",
    response_model=CartRead,
    status_code=status.HTTP_201_CREATED,
    operation_id="addCartItem",
)
async def add_item(
    payload: CartItemAdd,
    session: DbSession,
    response: Response,
    user: OptionalUser = None,
    cart_token: CartToken = None,
) -> CartRead:
    """Add a product to the cart. This never reserves stock (§5.3)."""
    cart = await _resolve(session, user, cart_token, response)
    updated = await cart_service.add_item(
        session, cart, product_id=payload.product_id, quantity=payload.quantity
    )
    return _view(updated)


@router.patch("/items/{item_id}", response_model=CartRead, operation_id="updateCartItem")
async def update_item(
    item_id: str,
    payload: CartItemUpdate,
    session: DbSession,
    response: Response,
    user: OptionalUser = None,
    cart_token: CartToken = None,
) -> CartRead:
    """Set a line's quantity. A quantity of zero removes the line."""
    cart = await _resolve(session, user, cart_token, response)
    updated = await cart_service.set_quantity(
        session, cart, item_id=item_id, quantity=payload.quantity
    )
    return _view(updated)


@router.delete("/items/{item_id}", response_model=CartRead, operation_id="removeCartItem")
async def remove_item(
    item_id: str,
    session: DbSession,
    response: Response,
    user: OptionalUser = None,
    cart_token: CartToken = None,
) -> CartRead:
    """Remove a line from the cart."""
    cart = await _resolve(session, user, cart_token, response)
    return _view(await cart_service.remove_item(session, cart, item_id=item_id))


@router.delete("", response_model=CartRead, operation_id="clearCart")
async def clear_cart(
    session: DbSession, response: Response, user: OptionalUser = None, cart_token: CartToken = None
) -> CartRead:
    """Empty the cart."""
    cart = await _resolve(session, user, cart_token, response)
    return _view(await cart_service.clear(session, cart))
