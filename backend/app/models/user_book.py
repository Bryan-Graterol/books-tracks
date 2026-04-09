import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    SmallInteger,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ReadingStatus(str, enum.Enum):
    want_to_read = "want_to_read"
    reading = "reading"
    paused = "paused"
    completed = "completed"
    abandoned = "abandoned"


class UserBook(Base):
    __tablename__ = "user_books"
    __table_args__ = (
        UniqueConstraint("user_id", "book_id"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_rating_range"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    book_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"))
    status: Mapped[ReadingStatus] = mapped_column(
        Enum(ReadingStatus, name="reading_status"),
        default=ReadingStatus.want_to_read,
    )
    current_page: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[int | None] = mapped_column(SmallInteger)
    started_at: Mapped[date | None] = mapped_column(Date)
    finished_at: Mapped[date | None] = mapped_column(Date)
    reader_url: Mapped[str | None] = mapped_column(Text)
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    user: Mapped["User"] = relationship(back_populates="user_books")  # type: ignore[name-defined] # noqa: F821
    book: Mapped["Book"] = relationship(back_populates="user_books")  # type: ignore[name-defined] # noqa: F821
    sessions: Mapped[list["ReadingSession"]] = relationship(back_populates="user_book", cascade="all, delete-orphan")  # type: ignore[name-defined] # noqa: F821
    notes: Mapped[list["Note"]] = relationship(back_populates="user_book", cascade="all, delete-orphan")  # type: ignore[name-defined] # noqa: F821
