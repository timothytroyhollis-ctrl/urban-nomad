import os
import httpx

BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"


def _normalize(event: dict) -> dict:
    dates = event.get("dates", {}).get("start", {})
    venue = (event.get("_embedded", {}).get("venues") or [{}])[0]
    images = event.get("images", [])
    thumb = next((i["url"] for i in images if i.get("ratio") == "3_2"), None)

    return {
        "id": f"tm-{event['id']}",
        "source": "ticketmaster",
        "name": event.get("name"),
        "start_date": dates.get("localDate"),
        "start_time": dates.get("localTime"),
        "venue_name": venue.get("name"),
        "venue_address": venue.get("address", {}).get("line1"),
        "city": venue.get("city", {}).get("name"),
        "url": event.get("url"),
        "image": thumb,
        "category": (event.get("classifications") or [{}])[0]
            .get("segment", {})
            .get("name"),
    }


async def search_ticketmaster(
    city: str,
    category: str | None,
    start_date: str | None,
    end_date: str | None,
    size: int,
) -> list[dict]:
    api_key = os.getenv("TICKETMASTER_API_KEY")
    if not api_key:
        return []

    params = {"apikey": api_key, "city": city, "size": size, "sort": "date,asc"}
    if category:
        params["classificationName"] = category
    if start_date:
        params["startDateTime"] = f"{start_date}T00:00:00Z"
    if end_date:
        params["endDateTime"] = f"{end_date}T23:59:59Z"

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(BASE_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    raw = data.get("_embedded", {}).get("events", [])
    return [_normalize(e) for e in raw]
