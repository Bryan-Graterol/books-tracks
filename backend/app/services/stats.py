"""
Reading stats computed from the database.
All queries run against a single user_id.
"""

import uuid
from datetime import date, timedelta

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.book import Book
from app.models.reading_session import ReadingSession
from app.models.user_book import ReadingStatus, UserBook
from app.schemas.stats import StatsOut


async def get_stats(db: AsyncSession, user_id: uuid.UUID) -> StatsOut:
    now = date.today()
    year_start = date(now.year, 1, 1)
    month_start = date(now.year, now.month, 1)

    # ── basic counts ────────────────────────────────────────────────────────
    total_q = await db.scalar(
        select(func.count()).select_from(UserBook).where(UserBook.user_id == user_id)
    )

    # Total completados (sin importar el año)
    total_completed_q = await db.scalar(
        select(func.count())
        .select_from(UserBook)
        .where(
            UserBook.user_id == user_id,
            UserBook.status == ReadingStatus.completed,
        )
    )

    # Este año: finished_at en el año actual, O sin fecha pero añadido/completado este año
    year_q = await db.scalar(
        select(func.count())
        .select_from(UserBook)
        .where(
            UserBook.user_id == user_id,
            UserBook.status == ReadingStatus.completed,
            or_(
                UserBook.finished_at >= year_start,
                and_(
                    UserBook.finished_at.is_(None),
                    func.date(UserBook.added_at) >= year_start,
                ),
            ),
        )
    )

    # Este mes: igual pero con month_start
    month_q = await db.scalar(
        select(func.count())
        .select_from(UserBook)
        .where(
            UserBook.user_id == user_id,
            UserBook.status == ReadingStatus.completed,
            or_(
                UserBook.finished_at >= month_start,
                and_(
                    UserBook.finished_at.is_(None),
                    func.date(UserBook.added_at) >= month_start,
                ),
            ),
        )
    )

    # ── pages this year (from sessions) ─────────────────────────────────────
    pages_year_q = await db.scalar(
        select(func.coalesce(func.sum(ReadingSession.pages_read), 0))
        .join(UserBook, ReadingSession.user_book_id == UserBook.id)
        .where(
            UserBook.user_id == user_id,
            func.date(ReadingSession.session_date) >= year_start,
        )
    )

    # ── avg rating ──────────────────────────────────────────────────────────
    avg_rating_q = await db.scalar(
        select(func.coalesce(func.avg(UserBook.rating), 0.0))
        .where(UserBook.user_id == user_id, UserBook.rating.isnot(None))
    )

    # ── total reading minutes ────────────────────────────────────────────────
    total_minutes_q = await db.scalar(
        select(func.coalesce(func.sum(ReadingSession.duration_minutes), 0))
        .join(UserBook, ReadingSession.user_book_id == UserBook.id)
        .where(UserBook.user_id == user_id)
    )

    # ── by status ────────────────────────────────────────────────────────────
    status_rows = (
        await db.execute(
            select(UserBook.status, func.count().label("cnt"))
            .where(UserBook.user_id == user_id)
            .group_by(UserBook.status)
        )
    ).all()
    by_status: dict[ReadingStatus, int] = {s: 0 for s in ReadingStatus}
    for row in status_rows:
        by_status[row.status] = row.cnt

    # ── by genre ─────────────────────────────────────────────────────────────
    genre_rows = (
        await db.execute(
            select(Book.genre, func.count().label("cnt"))
            .join(UserBook, UserBook.book_id == Book.id)
            .where(UserBook.user_id == user_id, Book.genre.isnot(None))
            .group_by(Book.genre)
            .order_by(func.count().desc())
        )
    ).all()
    by_genre = [{"genre": r.genre, "count": r.cnt} for r in genre_rows]

    # ── monthly pages (current year) ─────────────────────────────────────────
    monthly_rows = (
        await db.execute(
            select(
                func.to_char(ReadingSession.session_date, "Mon").label("month"),
                func.extract("month", ReadingSession.session_date).label("month_num"),
                func.coalesce(func.sum(ReadingSession.pages_read), 0).label("pages"),
            )
            .join(UserBook, ReadingSession.user_book_id == UserBook.id)
            .where(
                UserBook.user_id == user_id,
                func.date_part("year", ReadingSession.session_date) == now.year,
            )
            .group_by("month", "month_num")
            .order_by("month_num")
        )
    ).all()
    monthly_pages = [{"month": r.month, "pages": int(r.pages)} for r in monthly_rows]

    # ── streaks ──────────────────────────────────────────────────────────────
    current_streak, longest_streak = await _compute_streaks(db, user_id)

    return StatsOut(
        total_books=total_q or 0,
        total_completed=total_completed_q or 0,
        books_this_year=year_q or 0,
        books_this_month=month_q or 0,
        pages_this_year=int(pages_year_q or 0),
        avg_rating=round(float(avg_rating_q or 0), 2),
        current_streak=current_streak,
        longest_streak=longest_streak,
        total_minutes=int(total_minutes_q or 0),
        by_status=by_status,
        by_genre=by_genre,
        monthly_pages=monthly_pages,
    )


async def _compute_streaks(
    db: AsyncSession, user_id: uuid.UUID
) -> tuple[int, int]:
    """Returns (current_streak, longest_streak) in days."""
    rows = (
        await db.execute(
            select(func.date(ReadingSession.session_date).label("day"))
            .join(UserBook, ReadingSession.user_book_id == UserBook.id)
            .where(UserBook.user_id == user_id)
            .group_by(func.date(ReadingSession.session_date))
            .order_by(func.date(ReadingSession.session_date).desc())
        )
    ).scalars().all()

    if not rows:
        return 0, 0

    today = date.today()
    current = 0
    longest = 0
    streak = 0
    prev: date | None = None

    for day in rows:
        if prev is None:
            if day == today or day == today - timedelta(days=1):
                streak = 1
            else:
                streak = 0
        else:
            if (prev - day).days == 1:
                streak += 1
            else:
                longest = max(longest, streak)
                streak = 1

        if prev is None or (prev - day).days == 1:
            if day == today or day == today - timedelta(days=1):
                current = streak
        prev = day

    longest = max(longest, streak)
    return current, longest
