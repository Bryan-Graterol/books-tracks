import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.book import Book
from app.models.note import Note
from app.models.user_book import UserBook
from app.routers.library import _fetch_user_book, current_user_id
from app.schemas.note import NoteCreate, NoteOut, NoteUpdate, NoteWithBookOut

router = APIRouter(tags=["notes"])


@router.get("/notes", response_model=list[NoteWithBookOut])
async def list_all_notes(
    limit: int = Query(default=10, ge=1, le=50),
    user_id: uuid.UUID = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Devuelve las notas más recientes del usuario en todos sus libros."""
    rows = (
        await db.execute(
            select(Note, Book.title.label("book_title"))
            .join(UserBook, Note.user_book_id == UserBook.id)
            .join(Book, UserBook.book_id == Book.id)
            .where(UserBook.user_id == user_id)
            .order_by(Note.created_at.desc())
            .limit(limit)
        )
    ).all()

    return [
        NoteWithBookOut(
            id=note.id,
            user_book_id=note.user_book_id,
            content=note.content,
            page_ref=note.page_ref,
            type=note.type,
            created_at=note.created_at,
            updated_at=note.updated_at,
            book_title=book_title,
        )
        for note, book_title in rows
    ]


@router.get("/library/{user_book_id}/notes", response_model=list[NoteOut])
async def list_notes(
    user_book_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await _fetch_user_book(db, user_book_id, user_id)
    rows = await db.execute(
        select(Note)
        .where(Note.user_book_id == user_book_id)
        .order_by(Note.created_at.desc())
    )
    return rows.scalars().all()


@router.post(
    "/library/{user_book_id}/notes",
    response_model=NoteOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_note(
    user_book_id: uuid.UUID,
    body: NoteCreate,
    user_id: uuid.UUID = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    ub = await _fetch_user_book(db, user_book_id, user_id)
    note = Note(
        user_book_id=ub.id,
        content=body.content,
        type=body.type,
        page_ref=body.page_ref,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


@router.patch("/notes/{note_id}", response_model=NoteOut)
async def update_note(
    note_id: uuid.UUID,
    body: NoteUpdate,
    user_id: uuid.UUID = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    note = await _fetch_note_for_user(db, note_id, user_id)
    note.content = body.content
    await db.commit()
    await db.refresh(note)
    return note


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    note = await _fetch_note_for_user(db, note_id, user_id)
    await db.delete(note)
    await db.commit()


# ── helpers ──────────────────────────────────────────────────────────────────

async def _fetch_note_for_user(
    db: AsyncSession, note_id: uuid.UUID, user_id: uuid.UUID
) -> Note:
    from app.models.user_book import UserBook

    note = await db.scalar(
        select(Note)
        .join(UserBook, Note.user_book_id == UserBook.id)
        .where(Note.id == note_id, UserBook.user_id == user_id)
    )
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note
