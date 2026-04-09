import logging
import mimetypes
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.routing import APIRouter
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import check_connection
from app.routers import books, library, notes, sessions, stats, users

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s  %(name)s  %(message)s",
)
log = logging.getLogger(__name__)

# Ruta absoluta — independiente del directorio de trabajo
DIST = Path("/app/dist")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Iniciando %s v%s", settings.app_name, settings.app_version)
    log.info("Frontend dist: %s | existe: %s", DIST, DIST.exists())
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

# ── API routes ────────────────────────────────────────────────────────────────
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
if DIST.exists():
    # Sirve assets estáticos con headers de caché correctos
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/", include_in_schema=False)
    async def root() -> FileResponse:
        return FileResponse(DIST / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str) -> FileResponse:
        candidate = DIST / full_path
        if candidate.is_file():
            media_type, _ = mimetypes.guess_type(str(candidate))
            return FileResponse(candidate, media_type=media_type or "application/octet-stream")
        return FileResponse(DIST / "index.html")
else:
    log.warning("dist/ no encontrado en %s — modo desarrollo (sin frontend estático)", DIST)
