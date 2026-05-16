from fastapi import APIRouter, HTTPException, Query
from ..services.ticketmaster import search_ticketmaster
from ..services.eventbrite import search_eventbrite

router = APIRouter(tags=["events"])


@router.get("/events")
async def get_events(
    city: str = Query(..., min_length=1, max_length=100),
    category: str | None = Query(None),
    start_date: str | None = Query(None, description="ISO date YYYY-MM-DD"),
    end_date: str | None = Query(None, description="ISO date YYYY-MM-DD"),
    size: int = Query(20, ge=1, le=50),
):
    try:
        tm, eb = await search_ticketmaster(city, category, start_date, end_date, size), None
        try:
            eb = await search_eventbrite(city, category, start_date, end_date, size)
        except Exception:
            eb = []

        events = sorted(
            (tm or []) + (eb or []),
            key=lambda e: e.get("start_date") or "",
        )
        return {"city": city, "count": len(events), "events": events}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
