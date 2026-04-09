import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.allowed_email import AllowedEmail
from app.models.user import User
from app.schemas.user import UserCreate, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Crea un nuevo usuario. El email debe estar en la lista de permitidos."""
    email = body.email.lower().strip()

    # Admin y demo siempre pasan
    privileged = {settings.admin_email.lower(), settings.demo_email.lower()}
    if email not in privileged:
        allowed = await db.scalar(
            select(AllowedEmail).where(AllowedEmail.email == email)
        )
        if not allowed:
            raise HTTPException(
                status_code=403,
                detail="Este email no está autorizado. Contacta al administrador.",
            )

    existing = await db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Ya existe un usuario con el email '{email}'",
        )

    user = User(name=body.name, email=email)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.get("/by-email/{email}", response_model=UserOut)
async def get_user_by_email(
    email: str,
    db: AsyncSession = Depends(get_db),
):
    """Útil para login simple: buscar usuario por email."""
    user = await db.scalar(select(User).where(User.email == email))
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user
