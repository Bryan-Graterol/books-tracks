import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Crea un nuevo usuario. El email debe ser único."""
    existing = await db.scalar(select(User).where(User.email == body.email))
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Ya existe un usuario con el email '{body.email}'",
        )

    user = User(name=body.name, email=body.email)
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
