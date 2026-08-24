"""add product compare-at price

Revision ID: c77db6c2d6be
Revises: bc8c0385a1c7
Create Date: 2026-08-20 17:08:07.295000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c77db6c2d6be"
down_revision: str | None = "bc8c0385a1c7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Reviewed by hand: autogenerate also proposed dropping `ix_products_fts`
    # and `ix_products_active`, which it cannot see in the model metadata.
    # Those drops were removed; `include_object` in env.py now filters them.
    op.add_column("products", sa.Column("compare_at_amount_minor", sa.Integer(), nullable=True))
    op.create_check_constraint(
        "ck_products_compare_at_above_price",
        "products",
        "compare_at_amount_minor IS NULL OR compare_at_amount_minor > price_amount_minor",
    )


def downgrade() -> None:
    op.drop_constraint("ck_products_compare_at_above_price", "products", type_="check")
    op.drop_column("products", "compare_at_amount_minor")
