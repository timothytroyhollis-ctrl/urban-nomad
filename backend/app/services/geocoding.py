"""Geocoding helpers using OpenStreetMap Nominatim (free, no API key)."""
import re
import httpx

NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "UrbanNomad/0.1 (https://github.com/TTHollis/urban-nomad)"


async def zip_to_location(zip_code: str, country: str = "us") -> dict | None:
    """
    Look up a postal code and return {city, state, country}.
    Falls back to None if not found.

    Why: Ticketmaster's postalCode filter is too narrow — most events in a
    given zip won't actually be ticketed at that exact postal code. We expand
    to the city level for a much more useful search.
    """
    params = {
        "postalcode": zip_code,
        "country": country,
        "format": "jsonv2",
        "addressdetails": 1,
        "limit": 1,
    }
    headers = {"User-Agent": USER_AGENT, "Accept-Language": "en"}

    try:
        async with httpx.AsyncClient(timeout=8, headers=headers) as client:
            resp = await client.get(NOMINATIM_SEARCH, params=params)
            if resp.status_code != 200:
                return None
            data = resp.json()
            if not data:
                # Try again without country lock — some postal codes are non-US
                params.pop("country", None)
                resp = await client.get(NOMINATIM_SEARCH, params=params)
                if resp.status_code != 200:
                    return None
                data = resp.json()
                if not data:
                    return None
    except Exception:
        return None

    addr = data[0].get("address", {}) if data else {}
    city = (
        addr.get("city")
        or addr.get("town")
        or addr.get("village")
        or addr.get("hamlet")
        or addr.get("municipality")
        or addr.get("county")
    )
    # Pull 2-letter state code from ISO3166-2-lvl4 like "US-FL"
    iso = addr.get("ISO3166-2-lvl4", "")
    state_code = ""
    if iso and "-" in iso:
        parts = iso.split("-")
        if len(parts) > 1 and len(parts[1]) <= 3:
            state_code = parts[1]
    if not state_code:
        state_code = addr.get("state", "") or ""
    country_code = (addr.get("country_code") or "").upper()

    if not city:
        return None
    return {"city": city, "state": state_code, "country": country_code}


_ZIP_PATTERN = re.compile(r"^\d{5}$")


async def canonicalize_location(label: str) -> str:
    """
    Normalize a location label so tips stored under a zip code show up
    for a city search, and vice versa.

    Rules:
      - "32099"          -> "Jacksonville, FL"   (expand US zips)
      - "Jacksonville, FL" -> unchanged
      - "Tokyo"          -> unchanged
      - "Jacksonville, FL (32099)" -> "Jacksonville, FL" (strip zip suffix)

    Returns the canonical label. Falls back to the input if lookup fails.
    """
    cleaned = (label or "").strip()
    if not cleaned:
        return cleaned

    # Strip any "(12345)" zip suffix the events router may have added
    cleaned = re.sub(r"\s*\(\d{5}\)\s*$", "", cleaned)

    # 5-digit numeric → US zip → expand to city, state
    if _ZIP_PATTERN.match(cleaned):
        location = await zip_to_location(cleaned)
        if location and location.get("city"):
            state = location.get("state")
            return f"{location['city']}, {state}" if state else location["city"]

    return cleaned
