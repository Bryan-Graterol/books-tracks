from fastapi import APIRouter, HTTPException, Query

from app.schemas.book import BookSearchResult
from app.services.book_api import search_books

router = APIRouter(prefix="/books", tags=["books"])


@router.get("/search", response_model=list[BookSearchResult])
async def search(
    q: str = Query(min_length=2, description="Title, author, or ISBN"),
    source: str = Query(default="openlibrary", pattern="^(openlibrary|google_books)$"),
    limit: int = Query(default=15, ge=1, le=40),
):
    """Search for books in external APIs. Results can then be added to the library."""
    try:
        return await search_books(q, source=source)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"External API error: {exc}") from exc
