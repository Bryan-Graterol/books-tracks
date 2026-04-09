import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class NoteType(str, enum.Enum):
    highlight = "highlight"
    quote = "quote"
    reflection = "reflection"
    bookmark = "bookmark"


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_book_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user_books.id", ondelete="CASCADE")
    )
    content: Mapped[str] = mapped_column(Text)
    page_ref: Mapped[int | None] = mapped_column(Integer)
    type: Mapped[NoteType] = mapped_column(
        Enum(NoteType, name="note_type"), default=NoteType.reflection
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user_book: Mapped["UserBook"] = relationship(back_populates="notes")  # type: ignore[name-defined] # noqa: F821
