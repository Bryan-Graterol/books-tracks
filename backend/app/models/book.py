import uuid

from sqlalchemy import Integer, SmallInteger, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Book(Base):
    __tablename__ = "books"
    __table_args__ = (UniqueConstraint("source_api", "external_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    isbn: Mapped[str | None] = mapped_column(String(20), unique=True)
    title: Mapped[str] = mapped_column(String(500))
    author: Mapped[str | None] = mapped_column(String(300))
    publisher: Mapped[str | None] = mapped_column(String(300))
    year: Mapped[int | None] = mapped_column(SmallInteger)
    genre: Mapped[str | None] = mapped_column(String(100))
    language: Mapped[str | None] = mapped_column(String(50))
    cover_url: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    total_pages: Mapped[int | None] = mapped_column(Integer)
    source_api: Mapped[str | None] = mapped_column(String(100))
    external_id: Mapped[str | None] = mapped_column(String(200))

    user_books: Mapped[list["UserBook"]] = relationship(back_populates="book")  # type: ignore[name-defined] # noqa: F821
