"""Checkout: cart -> order -> payment handoff."""

from fastapi import APIRouter, Request, status

from app.api.deps import CartToken, IdempotencyKey, Transaction
from app.auth import DbSession, OptionalUser
from app.core.errors import EmptyCartError
from app.schemas.orders import CheckoutRequest, CheckoutResponse, order_read
from app.services import cart_service, order_service
from app.services.payments import get_payment_provider
from app.services.payments.types import OrderPaymentIntent

router = APIRouter(prefix="/checkout", tags=["checkout"], dependencies=[Transaction])

ENDPOINT = "POST /checkout"


@router.post(
    "",
    response_model=CheckoutResponse,
    status_code=status.HTTP_201_CREATED,
    operation_id="createCheckout",
)
async def create_checkout(
    payload: CheckoutRequest,
    request: Request,
    session: DbSession,
    idempotency_key: IdempotencyKey,
    user: OptionalUser = None,
    cart_token: CartToken = None,
) -> CheckoutResponse:
    """Place an order for everything in the cart.

    Requires an `Idempotency-Key`: a repeated key returns the original order
    rather than creating a second one. Totals and stock are decided by the
    server; anything the client sent about price is ignored (§5.2, §5.6).
    """
    body = payload.model_dump(mode="json")
    replayed = await order_service.replay_idempotent(
        session, key=idempotency_key, endpoint=ENDPOINT, payload=body
    )
    if replayed is not None:
        return CheckoutResponse.model_validate(replayed)

    cart = await cart_service.get_or_create_cart(
        session, user_id=user.id if user else None, session_token=cart_token
    )
    if not cart.items:
        raise EmptyCartError()

    order = await order_service.create_order(
        session,
        cart=cart,
        buyer_id=user.id if user else None,
        guest_email=payload.email,
        address=payload.shipping_address,
        prescription_id=payload.prescription_id,
    )

    # The provider is reached only through the port; no PSP type appears here (§3.7).
    provider = get_payment_provider()
    checkout_session = await provider.create_checkout_session(
        OrderPaymentIntent(
            order_id=order.id,
            amount_minor=order.total_amount_minor,
            currency=order.currency,
            buyer_reference=user.id if user else order.number,
            seller_splits=order_service.payment_intent_splits(order),
        )
    )
    order.payment_ref = checkout_session.payment_ref

    response = CheckoutResponse(
        order=order_read(order), payment_redirect_url=checkout_session.redirect_url
    )
    await order_service.store_idempotent(
        session,
        key=idempotency_key,
        endpoint=ENDPOINT,
        payload=body,
        response=response.model_dump(mode="json"),
    )
    return response
