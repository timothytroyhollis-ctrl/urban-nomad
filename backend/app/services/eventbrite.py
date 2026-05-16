import os
import httpx

BASE_URL = "https://www.eventbriteapi.com/v3/events/search/"


def _normalize(event: dict) -> dict:
    venue = event.get("venue") or {}
    address = venue.get("address") or {}
    logo = event.get("logo") or {}

    return {
        "id": f"eb-{event['id']}",
        "source": "eventbrite",
        "name": (event.get("name") or {}).get("text"),
        "start_date": (event.get("start") or {}).get("local", "")[:10] or None,
        "start_time": (event.get("start") or {}).get("local", "")[11:16] or None,
        "venue_name": venue.get("name"),
        "venue_address": address.get("address_1"),
        "city": address.get("city"),
        "url": event.get("url"),
        "image": (logo.get("original") or {}).get("url"),
        "category": None,
    }


async def search_eventbrite(
    city: str,
    category: str | None,
    start_date: str | None,
    end_date: str | None,
    size: int,
) -> list[dict]:
    token = os.getenv("EVENTBRITE_TOKEN")
    if not token:
        return []

    params = {
        "location.address": city,
        "expand": "venue",
        "page_size": min(size, 50),
        "sort_by": "date",
    }
    if start_date:
        params["start_date.range_start"] = f"{start_date}T00:00:00"
    if end_date:
        params["start_date.range_end"] = f"{end_date}T23:59:59"

    async with httpx.AsyncClient(
        timeout=10,
        headers={"Authorization": f"Bearer {token}"},
    ) as client:
        resp = await client.get(BASE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    return [_normalize(e) for e in data.get("events", [])]
