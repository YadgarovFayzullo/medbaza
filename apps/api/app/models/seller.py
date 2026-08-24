from typing import TYPE_CHECKING

from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Timestamped, UUIDPrimaryKey
from app.models.enums import SellerStatus

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.user import User


class Seller(UUIDPrimaryKey, Timestamped, Base):
    __tablename__ = "sellers"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    business_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    country: Mapped[str] = mapped_column(String(2), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)

    status: Mapped[str] = mapped_column(String(16), default=SellerStatus.PENDING, nullable=False)
    rejection_reason: Mapped[str | None] = mapped_column(Text)

    # Regulatory identifiers reviewed by an admin during verification.
    license_number: Mapped[str | None] = mapped_column(String(128))
    tax_id: Mapped[str | None] = mapped_column(String(128))
    certification_documents: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    # Provider-agnostic: holds whatever reference the chosen PSP issues for payouts.
    # Deliberately NOT typed to any SDK — see CLAUDE.md "Payment Provider".
    payout_account_ref: Mapped[str | None] = mapped_column(String(255))
    payout_enabled: Mapped[bool] = mapped_column(default=False, nullable=False)

    user: Mapped["User"] = relationship(back_populates="seller")
    products: Mapped[list["Product"]] = relationship(back_populates="seller")

    @property
    def verified(self) -> bool:
        """Drives the verified-seller badge on the storefront."""
        return self.status == SellerStatus.VERIFIED
