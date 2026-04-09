import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

log = logging.getLogger(__name__)

engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,   # verifica la conexión antes de usarla
    pool_size=10,
    max_overflow=20,
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:  # type: ignore[return]
    async with AsyncSessionLocal() as session:
        yield session


async def check_connection() -> None:
    """Verifica que la base de datos esté accesible al iniciar la app."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        log.info("PostgreSQL connection OK")
    except Exception as exc:
        log.critical("No se pudo conectar a PostgreSQL: %s", exc)
        raise
