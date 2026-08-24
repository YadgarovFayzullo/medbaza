from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Timestamped, UUIDPrimaryKey
from app.models.enums import PrescriptionStatus

if TYPE_CHECKING:
    from app.models.user import User


class Prescription(UUIDPrimaryKey, Timestamped, Base):
    """A buyer-uploaded prescription document.

    Only the storage *key* lives here. The bytes never enter a log, a response
    body, or a job argument (CLAUDE.md §5.5). Sellers never get access — they
    only ever learn that the gate is satisfied.
    """

    __tablename__ = "prescriptions"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    # Opaque object-storage key inside a private bucket; contents encrypted at rest.
    object_key: Mapped[str] = mapped_column(String(512), nullable=False)
    content_type: Mapped[str] = mapped_column(String(128), nullable=False)
    byte_size: Mapped[int] = mapped_column(Integer, nullable=False)
    # Buyer-supplied label only — never the document's contents.
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)

    status: Mapped[str] = mapped_column(
        String(24), default=PrescriptionStatus.PENDING_REVIEW, nullable=False, index=True
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    reviewed_by_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL")
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="prescriptions", foreign_keys=[user_id])
