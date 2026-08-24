"""constrain product rating counters

Revision ID: 3594929a3d04
Revises: c77db6c2d6be
Create Date: 2026-08-20 23:36:11.407823
"""

from collections.abc import Sequence

from alembic import op

revision: str = "3594929a3d04"
down_revision: str | None = "c77db6c2d6be"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Reviewed by hand: a CHECK cannot be added to a populated table that
    # already violates it, and rows written before this constraint could hold a
    # sum implying an average above 5. Clamp them into range first. The UPDATE
    # only touches offending rows, so it stays small; on a table where it would
    # not, add the constraint NOT VALID and VALIDATE it separately instead.
    op.execute("""
        UPDATE products
        SET rating_sum = LEAST(GREATEST(rating_sum, rating_count), rating_count * 5)
        WHERE rating_count > 0
          AND (rating_sum < rating_count OR rating_sum > rating_count * 5)
        """)
    op.execute("UPDATE products SET rating_sum = 0 WHERE rating_count <= 0")

    op.create_check_constraint(
        "ck_products_rating_within_range",
        "products",
        "rating_count >= 0 AND rating_sum >= 0 "
        "AND rating_sum >= rating_count AND rating_sum <= rating_count * 5",
    )


def downgrade() -> None:
    op.drop_constraint("ck_products_rating_within_range", "products", type_="check")
