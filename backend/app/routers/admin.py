"""
/admin — panel de administración.
Solo accesible por el usuario cuyo email coincide con settings.admin_email.
"""

import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.allowed_email import AllowedEmail
from app.models.user import User
from app.schemas.allowed_email import AllowedEmailIn, AllowedEmailOut
from app.schemas.user import UserOut

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Dependencia: solo admin ───────────────────────────────────────────────────

async def require_admin(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        uid = uuid.UUID(x_user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="ID inválido")

    user = await db.scalar(select(User).where(User.id == uid))
    if not user or user.email.lower() != settings.admin_email.lower():
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return user


# ── Usuarios registrados ──────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserOut])
async def list_users(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at))
    return result.scalars().all()


# ── Lista de emails permitidos ────────────────────────────────────────────────

@router.get("/allowed-emails", response_model=list[AllowedEmailOut])
async def list_allowed(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AllowedEmail).order_by(AllowedEmail.created_at))
    return result.scalars().all()


@router.post("/allowed-emails", response_model=AllowedEmailOut, status_code=status.HTTP_201_CREATED)
async def add_allowed(
    body: AllowedEmailIn,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    email = body.email.lower().strip()
    existing = await db.scalar(select(AllowedEmail).where(AllowedEmail.email == email))
    if existing:
        raise HTTPException(status_code=409, detail="El email ya está en la lista")
    entry = AllowedEmail(email=email)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/allowed-emails/{email}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_allowed(
    email: str,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        delete(AllowedEmail).where(AllowedEmail.email == email.lower())
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Email no encontrado")
    await db.commit()
