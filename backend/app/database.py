import logging
import ssl

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

log = logging.getLogger(__name__)

# Supabase (y cualquier host externo) requiere SSL
_connect_args: dict = {}
if any(host in settings.database_url for host in ("supabase.co", "supabase.com")):
    _ssl_ctx = ssl.create_default_context()
    _connect_args["ssl"] = _ssl_ctx
    log.info("SSL habilitado para la conexión a la base de datos")

engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,       # Supabase free tier tiene límite de conexiones
    max_overflow=10,
    connect_args=_connect_args,
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
