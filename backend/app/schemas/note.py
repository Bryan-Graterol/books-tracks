import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.note import NoteType


class NoteCreate(BaseModel):
    content: str = Field(min_length=1)
    type: NoteType = NoteType.reflection
    page_ref: int | None = Field(None, ge=0)


class NoteUpdate(BaseModel):
    content: str = Field(min_length=1)


class NoteOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_book_id: uuid.UUID
    content: str
    page_ref: int | None = None
    type: NoteType
    created_at: datetime
    updated_at: datetime


class NoteWithBookOut(BaseModel):
    """NoteOut enriquecido con el título del libro, para el dashboard."""

    id: uuid.UUID
    user_book_id: uuid.UUID
    content: str
    page_ref: int | None = None
    type: NoteType
    created_at: datetime
    updated_at: datetime
    book_title: str
