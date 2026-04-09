import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class SessionCreate(BaseModel):
    start_page: int = Field(ge=0)
    end_page: int = Field(ge=0)
    duration_minutes: int | None = Field(None, ge=1)

    @model_validator(mode="after")
    def end_ge_start(self) -> "SessionCreate":
        if self.end_page < self.start_page:
            raise ValueError("end_page must be >= start_page")
        return self


class SessionOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_book_id: uuid.UUID
    start_page: int
    end_page: int
    pages_read: int
    duration_minutes: int | None = None
    session_date: datetime
