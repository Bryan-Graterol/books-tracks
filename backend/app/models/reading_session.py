import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Computed, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ReadingSession(Base):
    __tablename__ = "reading_sessions"
    __table_args__ = (
        CheckConstraint("end_page >= start_page", name="ck_page_order"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_book_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user_books.id", ondelete="CASCADE")
    )
    start_page: Mapped[int] = mapped_column(Integer)
    end_page: Mapped[int] = mapped_column(Integer)
    # Mirrors the GENERATED ALWAYS AS column in the DB
    pages_read: Mapped[int] = mapped_column(
        Integer, Computed("end_page - start_page", persisted=True)
    )
    duration_minutes: Mapped[int | None] = mapped_column(Integer)
    session_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    user_book: Mapped["UserBook"] = relationship(back_populates="sessions")  # type: ignore[name-defined] # noqa: F821
