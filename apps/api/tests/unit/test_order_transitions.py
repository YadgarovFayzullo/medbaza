"""Table-driven cover of the shipment state machine (CLAUDE.md §5.4)."""

import pytest

from app.models.enums import OrderStatus, ShipmentStatus
from app.services.order_service import ALLOWED_TRANSITIONS

ALL_STATUSES = list(ShipmentStatus)


def test_every_status_has_an_entry() -> None:
    assert set(ALLOWED_TRANSITIONS) == set(ALL_STATUSES)


def test_terminal_states_have_no_exits() -> None:
    assert ALLOWED_TRANSITIONS[ShipmentStatus.CANCELLED] == frozenset()
    assert ALLOWED_TRANSITIONS[ShipmentStatus.REFUNDED] == frozenset()


@pytest.mark.parametrize(
    ("from_status", "to_status"),
    [
        (ShipmentStatus.PENDING_PAYMENT, ShipmentStatus.PAID),
        (ShipmentStatus.PENDING_PAYMENT, ShipmentStatus.PAYMENT_FAILED),
        (ShipmentStatus.PAID, ShipmentStatus.PROCESSING),
        (ShipmentStatus.PROCESSING, ShipmentStatus.SHIPPED),
        (ShipmentStatus.SHIPPED, ShipmentStatus.DELIVERED),
        (ShipmentStatus.DELIVERED, ShipmentStatus.RETURN_REQUESTED),
        (ShipmentStatus.RETURN_REQUESTED, ShipmentStatus.RETURNED),
        (ShipmentStatus.RETURNED, ShipmentStatus.REFUNDED),
    ],
)
def test_allowed(from_status: str, to_status: str) -> None:
    assert to_status in ALLOWED_TRANSITIONS[from_status]


@pytest.mark.parametrize(
    ("from_status", "to_status"),
    [
        # A shipped order is returned, never cancelled (§5.4).
        (ShipmentStatus.SHIPPED, ShipmentStatus.CANCELLED),
        (ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED),
        (ShipmentStatus.PENDING_PAYMENT, ShipmentStatus.SHIPPED),
        (ShipmentStatus.PENDING_PAYMENT, ShipmentStatus.DELIVERED),
        (ShipmentStatus.CANCELLED, ShipmentStatus.PAID),
        (ShipmentStatus.REFUNDED, ShipmentStatus.PROCESSING),
        (ShipmentStatus.PAID, ShipmentStatus.DELIVERED),
    ],
)
def test_rejected(from_status: str, to_status: str) -> None:
    assert to_status not in ALLOWED_TRANSITIONS[from_status]


class _FakeShipment:
    def __init__(self, status: str) -> None:
        self.status = status


class _FakeOrder:
    """Exercises the derived-status property without touching the database."""

    def __init__(self, *statuses: str) -> None:
        self.shipments = [_FakeShipment(s) for s in statuses]

    status = property(lambda self: _derive(self))


def _derive(order: _FakeOrder) -> str:
    from app.models.order import Order

    return Order.status.fget(order)  # type: ignore[attr-defined]


@pytest.mark.parametrize(
    ("statuses", "expected"),
    [
        ((ShipmentStatus.PENDING_PAYMENT,), OrderStatus.PENDING_PAYMENT),
        ((ShipmentStatus.PAID, ShipmentStatus.PENDING_PAYMENT), OrderStatus.PENDING_PAYMENT),
        ((ShipmentStatus.PAID, ShipmentStatus.PROCESSING), OrderStatus.PROCESSING),
        # Partial fulfilment is a normal, expected state (§5.2).
        ((ShipmentStatus.SHIPPED, ShipmentStatus.PROCESSING), OrderStatus.PARTIALLY_SHIPPED),
        ((ShipmentStatus.SHIPPED, ShipmentStatus.SHIPPED), OrderStatus.SHIPPED),
        ((ShipmentStatus.DELIVERED, ShipmentStatus.DELIVERED), OrderStatus.COMPLETED),
        ((ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED), OrderStatus.COMPLETED),
        ((ShipmentStatus.CANCELLED, ShipmentStatus.CANCELLED), OrderStatus.CANCELLED),
        ((ShipmentStatus.REFUNDED,), OrderStatus.REFUNDED),
        # One cancelled seller does not cancel the buyer's whole order.
        ((ShipmentStatus.CANCELLED, ShipmentStatus.SHIPPED), OrderStatus.SHIPPED),
    ],
)
def test_derived_order_status(statuses: tuple[str, ...], expected: str) -> None:
    assert _FakeOrder(*statuses).status == expected
