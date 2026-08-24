"""Catalog pricing and certification rules."""

import pytest

from app.core.errors import CertificationRequiredError, ValidationError
from app.services.catalog_service import (
    REGULATED_CATEGORY_SLUGS,
    _validate_compare_at,
    slugify,
)


def test_slugify_is_url_safe_and_stable() -> None:
    assert slugify("N95 respirator, cup style (box of 20)") == "n95-respirator-cup-style-box-of-20"
    assert slugify("  Ünïcode  Ítem  ") == "unicode-item"
    # Never empty, so a slug column is never asked to hold "".
    assert slugify("!!!") == "item"


def test_regulated_categories_are_the_ones_the_domain_calls_regulated() -> None:
    assert REGULATED_CATEGORY_SLUGS == {"ppe", "first-aid"}
    assert issubclass(CertificationRequiredError, ValidationError)


@pytest.mark.parametrize("compare_at", [None, 2000, 10_000])
def test_a_was_price_above_the_selling_price_is_accepted(compare_at: int | None) -> None:
    _validate_compare_at(1999, compare_at)


@pytest.mark.parametrize("compare_at", [0, 1, 1998, 1999])
def test_a_was_price_at_or_below_the_selling_price_is_rejected(compare_at: int) -> None:
    # A "discount" that is not a discount is a pricing bug, not a promotion.
    with pytest.raises(ValidationError) as caught:
        _validate_compare_at(1999, compare_at)
    assert caught.value.code == "INVALID_COMPARE_AT_PRICE"
