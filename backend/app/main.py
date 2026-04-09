import logging
import mimetypes
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.routing import APIRouter

from app.config import settings
from app.database import check_connection
from app.routers import books, library, notes, sessions, stats, users

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s  %(name)s  %(message)s",
)
log = logging.getLogger(__name__)

DIST = Path(__file__).parent.parent / "dist"


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
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routes (todas bajo /api) ──────────────────────────────────────────────
api = APIRouter()
api.include_router(users.router)
api.include_router(books.router)
api.include_router(library.router)
api.include_router(sessions.router)
api.include_router(notes.router)
api.include_router(stats.router)

app.include_router(api, prefix="/api")


@app.get("/api/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok", "version": settings.app_version}


# ── Frontend estático ─────────────────────────────────────────────────────────
# Catch-all: sirve archivos del dist/ o index.html para rutas de React Router.
# En desarrollo dist/ no existe, lo cual está bien (Vite dev server lo maneja).
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str) -> FileResponse:
    candidate = DIST / full_path
    if candidate.exists() and candidate.is_file():
        media_type, _ = mimetypes.guess_type(str(candidate))
        return FileResponse(candidate, media_type=media_type or "application/octet-stream")
    return FileResponse(DIST / "index.html")
