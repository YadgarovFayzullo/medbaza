"""Cursor encoding must round-trip and must fail soft on garbage."""

from app.core.pagination import decode_cursor, encode_cursor


def test_round_trip_with_and_without_a_sort_value() -> None:
    assert decode_cursor(encode_cursor(None, "abc")) == ("", "abc")
    assert decode_cursor(encode_cursor(1999, "abc")) == ("1999", "abc")
    assert decode_cursor(encode_cursor("name", "abc")) == ("name", "abc")


def test_malformed_cursors_are_treated_as_absent() -> None:
    # Cursors are opaque and may be stale; a bad one starts from the top
    # rather than 500-ing a browse page.
    assert decode_cursor("not-base64!!") is None
    assert decode_cursor("") is None
    assert decode_cursor(encode_cursor(None, "").replace("=", "")) is None
