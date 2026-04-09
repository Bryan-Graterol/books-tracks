import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import check_connection
from app.routers import books, library, notes, sessions, stats, users

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s  %(name)s  %(message)s",
)
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Iniciando %s v%s", settings.app_name, settings.app_version)
    await check_connection()
    yield
    log.info("Apagando servidor")


app = FastAPI(
    title=f"{settings.app_name} API",
    description="Backend para el tracker de lecturas BookShelf.",
    version=settings.app_version,
    contact={"email": settings.contact_email},
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(books.router)
app.include_router(library.router)
app.include_router(sessions.router)
app.include_router(notes.router)
app.include_router(stats.router)


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok", "version": settings.app_version}
