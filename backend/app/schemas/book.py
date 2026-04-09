import uuid

from pydantic import BaseModel


class BookOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    isbn: str | None = None
    title: str
    author: str | None = None
    publisher: str | None = None
    year: int | None = None
    genre: str | None = None
    language: str | None = None
    cover_url: str | None = None
    description: str | None = None
    total_pages: int | None = None
    source_api: str | None = None
    external_id: str | None = None


class BookSearchResult(BaseModel):
    """Shape returned from external book APIs (Open Library / Google Books)."""

    title: str
    author: str
    year: int | None = None
    cover_url: str | None = None
    isbn: str | None = None
    description: str | None = None
    total_pages: int | None = None
    genre: str | None = None
    publisher: str | None = None
    language: str | None = None
    source_api: str
    external_id: str
