"""Shipping and platform-fee arithmetic.

Shared by the cart preview and by order creation so a buyer is never shown one
total and charged another. All amounts are integer minor units (§5.1).
"""

from collections.abc import Mapping

from app.core.config import settings
from app.core.money import apply_bps, split_proportionally

# Flat per-seller shipping. Each seller ships separately, so each shipment
# carries its own line rather than the order carrying one blended charge.
# So'm figures, converted from the previous USD ones at the same rate as the
# catalog. They are a straight currency swap, not a re-costed delivery policy.
SHIPPING_FLAT_MINOR = 100_000
FREE_SHIPPING_THRESHOLD_MINOR = 1_250_000


def shipping_for_group(items_amount_minor: int) -> int:
    """Shipping for one seller's group of items."""
    if items_amount_minor <= 0:
        return 0
    if items_amount_minor >= FREE_SHIPPING_THRESHOLD_MINOR:
        return 0
    return SHIPPING_FLAT_MINOR


def platform_fee(shipment_total_minor: int) -> int:
    """The platform's cut of a shipment, in basis points of its total."""
    return apply_bps(shipment_total_minor, settings.platform_fee_bps)


def seller_splits(order_total_minor: int, per_seller_totals: Mapping[str, int]) -> dict[str, int]:
    """Divide the order total across sellers so the parts sum to the whole exactly.

    Any rounding remainder goes to the earliest seller ID in sorted order — a
    documented, deterministic party rather than an arbitrary one (§5.1).
    """
    seller_ids = sorted(per_seller_totals)
    weights = [per_seller_totals[sid] for sid in seller_ids]
    amounts = split_proportionally(order_total_minor, weights)
    return dict(zip(seller_ids, amounts, strict=True))
