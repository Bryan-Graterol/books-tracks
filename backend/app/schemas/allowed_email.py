import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class AllowedEmailIn(BaseModel):
    email: EmailStr


class AllowedEmailOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: str
    created_at: datetime
