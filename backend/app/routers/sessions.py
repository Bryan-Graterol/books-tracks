import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.reading_session import ReadingSession
from app.models.user_book import UserBook
from app.routers.library import _fetch_user_book, current_user_id
from app.schemas.session import SessionCreate, SessionOut

router = APIRouter(prefix="/library/{user_book_id}/sessions", tags=["sessions"])


@router.get("", response_model=list[SessionOut])
async def list_sessions(
    user_book_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _fetch_user_book(db, user_book_id, user_id)
    rows = await db.execute(
        select(ReadingSession)
        .where(ReadingSession.user_book_id == user_book_id)
        .order_by(ReadingSession.session_date.desc())
    )
    return rows.scalars().all()


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def log_session(
    user_book_id: uuid.UUID,
    body: SessionCreate,
    user_id: uuid.UUID = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    ub = await _fetch_user_book(db, user_book_id, user_id)

    session = ReadingSession(
        user_book_id=ub.id,
        start_page=body.start_page,
        end_page=body.end_page,
        duration_minutes=body.duration_minutes,
    )
    db.add(session)

    # Auto-advance current_page
    if body.end_page > ub.current_page:
        ub.current_page = body.end_page

    await db.commit()
    await db.refresh(session)
    return session
