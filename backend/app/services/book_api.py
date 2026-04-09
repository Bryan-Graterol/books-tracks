"""
Integración con Open Library (principal) y Google Books (opcional).
Open Library no requiere API key pero sí exige un User-Agent identificable.
"""

import logging

import httpx

from app.config import settings
from app.schemas.book import BookSearchResult

log = logging.getLogger(__name__)

# Open Library requiere identificar la app en el User-Agent
_HEADERS = {"User-Agent": settings.user_agent}


def _ol_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=10, headers=_HEADERS)


# ── Búsqueda ─────────────────────────────────────────────────────────────────

async def search_open_library(query: str, limit: int = 15) -> list[BookSearchResult]:
    params = {
        "q": query,
        "limit": limit,
        "fields": (
            "key,title,author_name,first_publish_year,"
            "isbn,cover_i,number_of_pages_median,"
            "subject,publisher,language"
        ),
    }

    async with _ol_client() as client:
        resp = await client.get("https://openlibrary.org/search.json", params=params)
        resp.raise_for_status()
        data = resp.json()

    results: list[BookSearchResult] = []
    for doc in data.get("docs", []):
        ol_key = doc.get("key", "")
        external_id = ol_key.replace("/works/", "").strip()
        if not external_id:
            continue

        cover_id = doc.get("cover_i")
        authors = doc.get("author_name", [])
        isbn_list = doc.get("isbn", [])
        subjects = doc.get("subject", [])
        publishers = doc.get("publisher", [])
        langs = doc.get("language", [])

        results.append(
            BookSearchResult(
                title=doc.get("title", "Unknown"),
                author=", ".join(authors) if authors else "Unknown",
                year=doc.get("first_publish_year"),
                cover_url=(
                    f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"
                    if cover_id
                    else None
                ),
                isbn=isbn_list[0] if isbn_list else None,
                total_pages=doc.get("number_of_pages_median"),
                genre=subjects[0] if subjects else None,
                publisher=publishers[0] if publishers else None,
                language=langs[0].upper() if langs else None,
                source_api="openlibrary",
                external_id=external_id,
            )
        )

    return results


# ── Fetch de metadata completa por work ID ───────────────────────────────────

async def get_work_by_id(work_id: str) -> BookSearchResult | None:
    """
    Obtiene la metadata completa de una obra de Open Library usando su work ID
    (ej. "OL7353617M"). Hace dos requests: uno al work y otro al primer autor.
    """
    async with _ol_client() as client:
        try:
            work_resp = await client.get(
                f"https://openlibrary.org/works/{work_id}.json"
            )
            work_resp.raise_for_status()
            work = work_resp.json()
        except httpx.HTTPError as exc:
            log.warning("Open Library works fetch error for %s: %s", work_id, exc)
            return None

        # Fetch del primer autor
        author_name = "Unknown"
        author_keys = work.get("authors", [])
        if author_keys:
            try:
                ak = author_keys[0].get("author", {}).get("key", "")
                if ak:
                    author_resp = await client.get(
                        f"https://openlibrary.org{ak}.json"
                    )
                    author_resp.raise_for_status()
                    author_name = author_resp.json().get("name", "Unknown")
            except httpx.HTTPError:
                pass  # author_name stays "Unknown"

    # Portada
    covers = work.get("covers", [])
    cover_url = (
        f"https://covers.openlibrary.org/b/id/{covers[0]}-L.jpg" if covers else None
    )

    # Descripción: puede ser string o {"value": "..."}
    desc_raw = work.get("description", "")
    description = (
        desc_raw.get("value", "") if isinstance(desc_raw, dict) else desc_raw
    ) or None

    # Subjects
    subjects = work.get("subjects", [])
    genre = subjects[0] if subjects else None

    # Año de primera publicación
    year: int | None = None
    first_pub = work.get("first_publish_date", "")
    if first_pub:
        try:
            year = int(str(first_pub)[:4])
        except ValueError:
            pass

    return BookSearchResult(
        title=work.get("title", "Unknown"),
        author=author_name,
        year=year,
        cover_url=cover_url,
        isbn=None,  # no está en el work endpoint
        description=description,
        total_pages=None,  # no está en el work endpoint
        genre=genre,
        publisher=None,
        language=None,
        source_api="openlibrary",
        external_id=work_id,
    )


# ── Google Books ──────────────────────────────────────────────────────────────

async def search_google_books(query: str, limit: int = 15) -> list[BookSearchResult]:
    params: dict = {"q": query, "maxResults": limit, "printType": "books"}
    if settings.google_books_api_key:
        params["key"] = settings.google_books_api_key

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            "https://www.googleapis.com/books/v1/volumes", params=params
        )
        resp.raise_for_status()
        data = resp.json()

    results: list[BookSearchResult] = []
    for item in data.get("items", []):
        info = item.get("volumeInfo", {})
        image_links = info.get("imageLinks", {})
        cover_url = image_links.get("thumbnail") or image_links.get("smallThumbnail")

        isbn = None
        for id_obj in info.get("industryIdentifiers", []):
            if id_obj.get("type") == "ISBN_13":
                isbn = id_obj.get("identifier")
                break

        categories = info.get("categories", [])
        year: int | None = None
        if info.get("publishedDate"):
            try:
                year = int(str(info["publishedDate"])[:4])
            except ValueError:
                pass

        results.append(
            BookSearchResult(
                title=info.get("title", "Unknown"),
                author=", ".join(info.get("authors", ["Unknown"])),
                year=year,
                cover_url=cover_url,
                isbn=isbn,
                description=info.get("description"),
                total_pages=info.get("pageCount"),
                genre=categories[0] if categories else None,
                publisher=info.get("publisher"),
                language=info.get("language"),
                source_api="google_books",
                external_id=item["id"],
            )
        )

    return results


# ── Entry point ───────────────────────────────────────────────────────────────

async def search_books(query: str, source: str = "openlibrary") -> list[BookSearchResult]:
    if source == "google_books":
        return await search_google_books(query)
    return await search_open_library(query)
