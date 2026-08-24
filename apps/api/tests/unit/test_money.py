"""Money arithmetic: every split must reconcile exactly (CLAUDE.md §5.1)."""

import random

import pytest

from app.core.money import (
    apply_bps,
    format_minor,
    minor_unit_exponent,
    normalise_currency,
    split_proportionally,
)
from app.services import pricing_service


def test_normalise_currency_uppercases_and_validates() -> None:
    assert normalise_currency(" usd ") == "USD"
    with pytest.raises(ValueError):
        normalise_currency("US")
    with pytest.raises(ValueError):
        normalise_currency("US1")


@pytest.mark.parametrize(
    ("amount", "bps", "expected"),
    [
        (0, 800, 0),
        (10_000, 800, 800),
        (999, 800, 80),  # 79.92 rounds half-up to 80
        (1, 800, 0),  # 0.08 of a cent rounds down to nothing
        (100, 10_000, 100),  # a 100% fee can never exceed the amount
    ],
)
def test_apply_bps(amount: int, bps: int, expected: int) -> None:
    assert apply_bps(amount, bps) == expected


def test_split_is_exact_and_deterministic() -> None:
    assert split_proportionally(100, [1, 1, 1]) == [34, 33, 33]
    # The remainder always lands on the earliest index — a documented party.
    assert sum(split_proportionally(100, [1, 1, 1])) == 100
    assert split_proportionally(10, []) == []
    assert split_proportionally(10, [0, 0]) == [10, 0]


def test_split_reconciles_for_random_inputs() -> None:
    """Property test: parts always sum to the whole, and none is negative."""
    rng = random.Random(1312)
    for _ in range(2_000):
        total = rng.randint(0, 5_000_000)
        weights = [rng.randint(0, 100_000) for _ in range(rng.randint(1, 8))]
        parts = split_proportionally(total, weights)
        assert sum(parts) == total
        assert all(part >= 0 for part in parts)
        assert len(parts) == len(weights)


def test_seller_splits_sum_to_order_total() -> None:
    rng = random.Random(99)
    for _ in range(500):
        per_seller = {f"seller-{i}": rng.randint(1, 90_000) for i in range(rng.randint(1, 5))}
        total = sum(per_seller.values())
        splits = pricing_service.seller_splits(total, per_seller)
        assert sum(splits.values()) == total
        assert set(splits) == set(per_seller)


def test_shipping_is_free_above_the_threshold() -> None:
    threshold = pricing_service.FREE_SHIPPING_THRESHOLD_MINOR
    assert pricing_service.shipping_for_group(0) == 0
    assert pricing_service.shipping_for_group(threshold - 1) == pricing_service.SHIPPING_FLAT_MINOR
    assert pricing_service.shipping_for_group(threshold) == 0


def test_format_minor_is_debug_only() -> None:
    assert format_minor(1999, "usd") == "19.99 USD"


def test_format_minor_respects_a_currency_without_a_minor_unit() -> None:
    """So'm is quoted whole: 437000 UZS is 437 000 so'm, not 4 370.00."""
    assert format_minor(437_000, "uzs") == "437000 UZS"
    assert minor_unit_exponent("UZS") == 0
    assert minor_unit_exponent("eur") == 2


def test_discount_percent_is_derived_never_stored() -> None:
    """The saving shown on a card comes from the two prices, not a third field."""
    from app.models.product import Product

    product = Product(price_amount_minor=7500, compare_at_amount_minor=10_000)
    assert product.discount_percent == 25

    product.compare_at_amount_minor = None
    assert product.discount_percent is None
