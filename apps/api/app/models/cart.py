from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Timestamped, UUIDPrimaryKey

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User


class Cart(UUIDPrimaryKey, Timestamped, Base):
    """A buyer's working basket.

    Guest carts are keyed by an opaque `session_token` and are claimed by a user
    on login. Adding to a cart never reserves stock (CLAUDE.md §5.3).
    """

    __tablename__ = "carts"

    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, unique=True
    )
    session_token: Mapped[str | None] = mapped_column(String(64), index=True, unique=True)

    user: Mapped["User | None"] = relationship()
    items: Mapped[list["CartItem"]] = relationship(
        back_populates="cart", cascade="all, delete-orphan", lazy="selectin"
    )


class CartItem(UUIDPrimaryKey, Timestamped, Base):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("cart_id", "product_id", name="uq_cart_items_cart_product"),)

    cart_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("carts.id", ondelete="CASCADE"), index=True, nullable=False
    )
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    cart: Mapped["Cart"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship(lazy="joined")
