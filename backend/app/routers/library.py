"""
/library — biblioteca personal del usuario.
Autenticación via header X-User-Id (UUID del usuario).
"""

import re
import uuid

import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.models.book import Book
from app.models.user_book import ReadingStatus, UserBook
from app.schemas.user_book import UserBookCreate, UserBookOut, UserBookUpdate
from app.services.book_api import get_work_by_id

router = APIRouter(prefix="/library", tags=["library"])


# ── Dependencia de usuario ────────────────────────────────────────────────────

async def current_user_id(x_user_id: str = Header(...)) -> uuid.UUID:
    try:
        return uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="X-User-Id debe ser un UUID válido")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[UserBookOut])
async def list_library(
    reading_status: ReadingStatus | None = None,
    user_id: uuid.UUID = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Lista todos los libros del usuario, con filtro opcional por status."""
    stmt = (
        select(UserBook)
        .options(selectinload(UserBook.book))
        .where(UserBook.user_id == user_id)
        .order_by(UserBook.added_at.desc())
    )
    if reading_status:
        stmt = stmt.where(UserBook.status == reading_status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=UserBookOut, status_code=status.HTTP_201_CREATED)
async def add_to_library(
    body: UserBookCreate,
    user_id: uuid.UUID = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Agrega un libro a la biblioteca.
    La metadata del libro viene del frontend (resultado de búsqueda),
    si ya existe en la DB se reutiliza el registro existente.
    """
    book = await _get_or_create_book(db, body)

    existing = await db.scalar(
        select(UserBook).where(
            UserBook.user_id == user_id,
            UserBook.book_id == book.id,
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="El libro ya está en tu biblioteca")

    user_book = UserBook(user_id=user_id, book_id=book.id, status=body.status)
    db.add(user_book)
    await db.commit()
    await db.refresh(user_book)
    # Cargar relación book para la respuesta
    result = await db.execute(
        select(UserBook)
        .options(selectinload(UserBook.book))
        .where(UserBook.id == user_book.id)
    )
    return result.scalar_one()


@router.get("/{user_book_id}", response_model=UserBookOut)
async def get_user_book(
    user_book_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await _fetch_user_book(db, user_book_id, user_id)


@router.patch("/{user_book_id}", response_model=UserBookOut)
async def update_user_book(
    user_book_id: uuid.UUID,
    body: UserBookUpdate,
    user_id: uuid.UUID = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    ub = await _fetch_user_book(db, user_book_id, user_id)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(ub, field, value)
    await db.commit()
    await db.refresh(ub)
    return ub


@router.get("/{user_book_id}/content")
async def get_reader_content(
    user_book_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetchea el contenido del libro desde reader_url y lo devuelve como texto plano.
    Soporta texto plano (.txt) y páginas HTML (extrae el contenido principal).
    """
    ub = await _fetch_user_book(db, user_book_id, user_id)
    if not ub.reader_url:
        raise HTTPException(status_code=404, detail="Este libro no tiene URL de lectura configurada")

    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=30,
            headers={"User-Agent": settings.user_agent},
        ) as client:
            resp = await client.get(ub.reader_url)
            resp.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"Error al acceder a la URL: {exc.response.status_code}")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"No se pudo conectar a la URL: {exc}")

    content_type = resp.headers.get("content-type", "")

    if "text/plain" in content_type:
        text = resp.text
    else:
        # HTML: extraer contenido legible con BeautifulSoup
        soup = BeautifulSoup(resp.text, "html.parser")

        # Eliminar elementos que no son contenido
        for tag in soup(["script", "style", "nav", "header", "footer",
                          "aside", "form", "button", "noscript", "iframe"]):
            tag.decompose()

        # Intentar encontrar el bloque principal de contenido
        main = (
            soup.find("article")
            or soup.find("main")
            or soup.find(id=re.compile(r"(content|text|chapter|book)", re.I))
            or soup.find(class_=re.compile(r"(content|text|chapter|book|reader)", re.I))
            or soup.find("body")
            or soup
        )

        # Extraer párrafos preservando saltos de línea
        paragraphs = []
        for element in main.find_all(["p", "h1", "h2", "h3", "h4", "h5", "h6", "pre"]):
            t = element.get_text(separator=" ", strip=True)
            if t:
                tag = element.name
                if tag in ("h1", "h2"):
                    paragraphs.append(f"\n\n# {t}\n")
                elif tag in ("h3", "h4", "h5", "h6"):
                    paragraphs.append(f"\n## {t}\n")
                elif tag == "pre":
                    paragraphs.append(f"\n{t}\n")
                else:
                    paragraphs.append(t)

        text = "\n\n".join(paragraphs) if paragraphs else main.get_text(separator="\n", strip=True)

    if not text or len(text.strip()) < 100:
        raise HTTPException(status_code=422, detail="No se pudo extraer contenido legible de la URL")

    return {"content": text.strip(), "source_url": ub.reader_url}


@router.delete("/{user_book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_library(
    user_book_id: uuid.UUID,
    user_id: uuid.UUID = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    ub = await _fetch_user_book(db, user_book_id, user_id)
    await db.delete(ub)
    await db.commit()


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _fetch_user_book(
    db: AsyncSession,
    user_book_id: uuid.UUID,
    user_id: uuid.UUID,
) -> UserBook:
    ub = await db.scalar(
        select(UserBook)
        .options(selectinload(UserBook.book))
        .where(UserBook.id == user_book_id, UserBook.user_id == user_id)
    )
    if not ub:
        raise HTTPException(status_code=404, detail="Libro no encontrado en tu biblioteca")
    return ub


async def _get_or_create_book(db: AsyncSession, body: UserBookCreate) -> Book:
    """
    Busca el libro por (source_api, external_id).
    - Si ya existe → lo reutiliza.
    - Si no → lo crea con la metadata enviada por el frontend.
    - Si la metadata está incompleta → hace fallback a la Works API de Open Library.
    """
    book = await db.scalar(
        select(Book).where(
            Book.source_api == body.source_api,
            Book.external_id == body.external_id,
        )
    )
    if book:
        return book

    # Intentar completar metadata desde Open Library si no viene del frontend
    title = body.title
    author = body.author
    cover_url = body.cover_url
    description = body.description

    if body.source_api == "openlibrary" and (not author or not cover_url):
        meta = await get_work_by_id(body.external_id)
        if meta:
            author = author or meta.author
            cover_url = cover_url or meta.cover_url
            description = description or meta.description

    book = Book(
        isbn=body.isbn,
        title=title,
        author=author,
        publisher=body.publisher,
        year=body.year,
        genre=body.genre,
        language=body.language,
        cover_url=cover_url,
        description=description,
        total_pages=body.total_pages,
        source_api=body.source_api,
        external_id=body.external_id,
    )
    db.add(book)
    await db.flush()  # obtiene el ID sin hacer commit aún
    return book
