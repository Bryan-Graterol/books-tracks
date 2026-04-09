from pydantic import BaseModel

from app.models.user_book import ReadingStatus


class StatsOut(BaseModel):
    total_books: int
    total_completed: int
    books_this_year: int
    books_this_month: int
    pages_this_year: int
    avg_rating: float
    current_streak: int
    longest_streak: int
    total_minutes: int
    by_status: dict[ReadingStatus, int]
    by_genre: list[dict[str, int | str]]
    monthly_pages: list[dict[str, int | str]]
