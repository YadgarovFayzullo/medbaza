"""Integer-minor-unit money helpers.

Money is `int` minor units plus an ISO-4217 code, everywhere (CLAUDE.md §5.1).
Nothing here ever produces a float, and every split reconciles exactly.
"""

from collections.abc import Sequence

CURRENCY_RE_ALLOWED = 3

# The catalog trades in Uzbek so'm. An order always carries its own code; this is
# only the fallback for a row or a payload that did not name one.
DEFAULT_CURRENCY = "UZS"

# ISO-4217 minor-unit exponents. Two decimals is the common case, so only the
# exceptions are listed. So'm is quoted in whole units: `amount_minor` on a UZS
# row *is* the so'm figure, not a hundredth of one.
_MINOR_UNIT_EXPONENTS = {"UZS": 0, "JPY": 0, "KRW": 0, "ISK": 0, "VND": 0}
DEFAULT_MINOR_UNIT_EXPONENT = 2


def minor_unit_exponent(currency: str) -> int:
    """How many minor units make one major unit, as a power of ten."""
    return _MINOR_UNIT_EXPONENTS.get(normalise_currency(currency), DEFAULT_MINOR_UNIT_EXPONENT)


def normalise_currency(currency: str) -> str:
    """Uppercase ISO-4217 code, validated for shape only."""
    code = currency.strip().upper()
    if len(code) != CURRENCY_RE_ALLOWED or not code.isalpha():
        raise ValueError(f"{currency!r} is not an ISO-4217 currency code")
    return code


def apply_bps(amount_minor: int, bps: int) -> int:
    """Basis-point fee, rounded half-up, never exceeding the amount itself."""
    if amount_minor < 0:
        raise ValueError("amount_minor must be non-negative")
    fee = (amount_minor * bps + 5_000) // 10_000
    return min(fee, amount_minor)


def split_proportionally(total_minor: int, weights: Sequence[int]) -> list[int]:
    """Split `total_minor` across `weights` so the parts sum to the whole exactly.

    Uses the largest-remainder method. Ties, and any leftover after distributing
    remainders, go to the earliest index — a documented, deterministic party
    rather than whoever floating point happened to favour.
    """
    if total_minor < 0:
        raise ValueError("total_minor must be non-negative")
    if any(w < 0 for w in weights):
        raise ValueError("weights must be non-negative")
    if not weights:
        return []

    weight_total = sum(weights)
    if weight_total == 0:
        # Nothing to weight by: give the whole amount to the first party.
        return [total_minor] + [0] * (len(weights) - 1)

    base = [(total_minor * w) // weight_total for w in weights]
    remainder = total_minor - sum(base)
    # Rank by fractional part descending, then by index ascending.
    order = sorted(
        range(len(weights)),
        key=lambda i: (-((total_minor * weights[i]) % weight_total), i),
    )
    for i in order[:remainder]:
        base[i] += 1
    return base


def format_minor(amount_minor: int, currency: str) -> str:
    """Debug/CLI formatting only. Buyer-facing formatting is the frontend's job."""
    code = normalise_currency(currency)
    exponent = minor_unit_exponent(code)
    if exponent == 0:
        return f"{amount_minor} {code}"
    major, minor = divmod(abs(amount_minor), 10**exponent)
    sign = "-" if amount_minor < 0 else ""
    return f"{sign}{major}.{minor:0{exponent}d} {code}"
