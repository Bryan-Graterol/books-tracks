import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.user_book import ReadingStatus
from .book import BookOut


class UserBookCreate(BaseModel):
    """
    Agrega un libro a la biblioteca del usuario.
    Incluye la metadata del libro directamente desde los resultados de búsqueda,
    evitando un segundo request a la API externa.
    """

    # Referencia al libro en la API externa
    source_api: str
    external_id: str
    status: ReadingStatus = ReadingStatus.want_to_read

    # Metadata del libro (viene del frontend al seleccionar un resultado)
    title: str
    author: str | None = None
    year: int | None = None
    cover_url: str | None = None
    isbn: str | None = None
    description: str | None = None
    total_pages: int | None = None
    genre: str | None = None
    publisher: str | None = None
    language: str | None = None


class UserBookUpdate(BaseModel):
    status: ReadingStatus | None = None
    current_page: int | None = Field(None, ge=0)
    rating: int | None = Field(None, ge=1, le=5)
    started_at: date | None = None
    finished_at: date | None = None
    reader_url: str | None = None


class UserBookOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    book_id: uuid.UUID
    book: BookOut
    status: ReadingStatus
    current_page: int
    rating: int | None = None
    started_at: date | None = None
    finished_at: date | None = None
    reader_url: str | None = None
    added_at: datetime
