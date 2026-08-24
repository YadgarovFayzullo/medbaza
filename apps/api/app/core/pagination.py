"""Keyset (cursor) pagination helpers.

Offset pagination is banned (CLAUDE.md §6): the catalog changes under the
reader. Every cursor encodes the last row's sort value plus its ID, so the
next page resumes exactly where the previous one stopped even if rows were
inserted or removed in between.
"""

import base64
import binascii

_SEPARATOR = "\x1f"


def encode_cursor(sort_value: str | int | None, row_id: str) -> str:
    raw = f"{'' if sort_value is None else sort_value}{_SEPARATOR}{row_id}"
    return base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")


def decode_cursor(cursor: str) -> tuple[str, str] | None:
    """Return `(sort_value, row_id)`, or None if the cursor is unusable.

    A malformed cursor is treated as "start from the beginning" rather than an
    error: cursors are opaque to clients and may be stale.
    """
    padded = cursor + "=" * (-len(cursor) % 4)
    try:
        raw = base64.urlsafe_b64decode(padded.encode()).decode()
    except (binascii.Error, UnicodeDecodeError):
        return None
    sort_value, separator, row_id = raw.partition(_SEPARATOR)
    if not separator or not row_id:
        return None
    return sort_value, row_id
