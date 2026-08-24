from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Timestamped, UUIDPrimaryKey

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User


class Review(UUIDPrimaryKey, Timestamped, Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("product_id", "buyer_id", name="uq_reviews_product_buyer"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating_range"),
    )

    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    buyer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str | None] = mapped_column(String(160))
    body: Mapped[str] = mapped_column(Text, default="", nullable=False)
    # Derived at creation from a delivered OrderItem for this buyer + product.
    verified_purchase: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    product: Mapped["Product"] = relationship(back_populates="reviews")
    buyer: Mapped["User"] = relationship(back_populates="reviews")
