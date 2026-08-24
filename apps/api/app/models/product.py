from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.money import DEFAULT_CURRENCY
from app.db.base import Base, Timestamped, UUIDPrimaryKey
from app.models.enums import ProductStatus

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.review import Review
    from app.models.seller import Seller


class Product(UUIDPrimaryKey, Timestamped, Base):
    """A seller's listing.

    Price is minor units + ISO-4217 currency (CLAUDE.md §5.1). `stock` is
    guarded by a CHECK constraint — the constraint is the real guarantee, the
    service check only exists to produce a good error message.
    """

    __tablename__ = "products"
    __table_args__ = (
        UniqueConstraint("seller_id", "sku", name="uq_products_seller_sku"),
        CheckConstraint("stock >= 0", name="ck_products_stock_non_negative"),
        CheckConstraint("price_amount_minor >= 0", name="ck_products_price_non_negative"),
        CheckConstraint(
            "compare_at_amount_minor IS NULL OR compare_at_amount_minor > price_amount_minor",
            name="ck_products_compare_at_above_price",
        ),
        # Ratings are 1-5, so the denormalised counters have to stay inside
        # that range too. Without this a bad write shows "9.2 out of 5".
        CheckConstraint(
            "rating_count >= 0 AND rating_sum >= 0 "
            "AND rating_sum >= rating_count AND rating_sum <= rating_count * 5",
            name="ck_products_rating_within_range",
        ),
        Index("ix_products_status_category", "status", "category_id"),
    )

    seller_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("sellers.id", ondelete="CASCADE"), index=True, nullable=False
    )
    category_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("categories.id", ondelete="RESTRICT"), index=True, nullable=False
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(280), unique=True, index=True, nullable=False)
    sku: Mapped[str] = mapped_column(String(64), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(128), index=True)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)

    price_amount_minor: Mapped[int] = mapped_column(Integer, nullable=False)
    # Was-price for a discounted line. Never used for charging — the order is
    # always built from `price_amount_minor` (CLAUDE.md §5.2).
    compare_at_amount_minor: Mapped[int | None] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default=DEFAULT_CURRENCY, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    unit_label: Mapped[str] = mapped_column(String(32), default="unit", nullable=False)

    # Regulatory metadata. `certifications` holds Certification values (CE/FDA/ISO).
    certifications: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    prescription_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    images: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    specs: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    status: Mapped[str] = mapped_column(
        String(16), default=ProductStatus.DRAFT, nullable=False, index=True
    )
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    rating_sum: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rating_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    seller: Mapped["Seller"] = relationship(back_populates="products")
    category: Mapped["Category"] = relationship(back_populates="products")
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )

    @property
    def discount_percent(self) -> int | None:
        """Whole-percent saving, derived — never stored, never rounded into money."""
        if not self.compare_at_amount_minor:
            return None
        saving = self.compare_at_amount_minor - self.price_amount_minor
        return round(saving * 100 / self.compare_at_amount_minor)

    @property
    def image_url(self) -> str | None:
        return self.images[0] if self.images else None

    @property
    def in_stock(self) -> bool:
        return self.stock > 0

    @property
    def rating_average(self) -> float | None:
        if self.rating_count == 0:
            return None
        return round(self.rating_sum / self.rating_count, 2)
