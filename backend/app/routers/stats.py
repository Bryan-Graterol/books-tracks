import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.routers.library import current_user_id
from app.schemas.stats import StatsOut
from app.services.stats import get_stats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", response_model=StatsOut)
async def reading_stats(
    user_id: uuid.UUID = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await get_stats(db, user_id)
