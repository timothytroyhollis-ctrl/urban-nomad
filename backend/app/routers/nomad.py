from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..models import LocalTip
from ..services.openai_service import generate_briefing

router = APIRouter(tags=["nomad"])


class TipCreate(BaseModel):
    city: str = Field(..., min_length=1, max_length=120)
    category: str = Field("general", max_length=60)
    content: str = Field(..., min_length=10, max_length=1000)
    author_handle: str = Field("anonymous", max_length=60)


@router.get("/briefing")
async def get_briefing(city: str = Query(..., min_length=1, max_length=100)):
    try:
        briefing = await generate_briefing(city)
        return {"city": city, "briefing": briefing}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.get("/tips")
async def get_tips(
    city: str = Query(..., min_length=1, max_length=100),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LocalTip)
        .where(LocalTip.city == city)
        .order_by(LocalTip.created_at.desc())
        .limit(50)
    )
    tips = result.scalars().all()
    return {
        "city": city,
        "tips": [
            {
                "id": t.id,
                "category": t.category,
                "content": t.content,
                "author_handle": t.author_handle,
                "created_at": t.created_at.isoformat(),
            }
            for t in tips
        ],
    }


@router.post("/tips", status_code=201)
async def post_tip(body: TipCreate, db: AsyncSession = Depends(get_db)):
    tip = LocalTip(**body.model_dump())
    db.add(tip)
    await db.commit()
    await db.refresh(tip)
    return {"id": tip.id, "created_at": tip.created_at.isoformat()}
