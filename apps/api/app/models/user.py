from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, CaseInsensitiveText, Timestamped, UUIDPrimaryKey
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.prescription import Prescription
    from app.models.review import Review
    from app.models.seller import Seller


class User(UUIDPrimaryKey, Timestamped, Base):
    __tablename__ = "users"

    # citext on Postgres: two addresses differing only in case are the same one.
    email: Mapped[str] = mapped_column(
        CaseInsensitiveText(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32))
    role: Mapped[str] = mapped_column(String(16), default=UserRole.BUYER, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    seller: Mapped["Seller | None"] = relationship(back_populates="user", uselist=False)
    addresses: Mapped[list["Address"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    orders: Mapped[list["Order"]] = relationship(back_populates="buyer")
    # `Prescription` also has a reviewer FK to users, so the path is explicit.
    prescriptions: Mapped[list["Prescription"]] = relationship(
        back_populates="user", foreign_keys="Prescription.user_id"
    )
    reviews: Mapped[list["Review"]] = relationship(back_populates="buyer")


class Address(UUIDPrimaryKey, Timestamped, Base):
    __tablename__ = "addresses"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    label: Mapped[str] = mapped_column(String(64), default="Home", nullable=False)
    recipient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    line1: Mapped[str] = mapped_column(String(255), nullable=False)
    line2: Mapped[str | None] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(128), nullable=False)
    region: Mapped[str | None] = mapped_column(String(128))
    postal_code: Mapped[str] = mapped_column(String(32), nullable=False)
    country: Mapped[str] = mapped_column(String(2), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32))
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped["User"] = relationship(back_populates="addresses")
