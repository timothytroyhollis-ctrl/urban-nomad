import os
from openai import AsyncOpenAI

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


SYSTEM_PROMPT = """You are a well-traveled, opinionated local friend who has spent
serious time in cities around the world. When someone asks about a city, you give them
a warm, conversational guide that helps them feel at home — like a real friend showing
them around.

Always respond in clean markdown using this structure:

# {City} — Your Local Guide
One short opening sentence that captures the city's personality.

## The Vibe
2-3 sentences on the energy, character, and feel of the place.

## Local Norms & Etiquette
3-5 bullet points on what locals expect. Focus on things visitors often get wrong.

## Where Locals Actually Hang
3-4 bullet points on neighborhoods, with what each one is known for.

## Food & Drink Essentials
3-4 bullet points on must-tries. Be specific — name dishes, drinks, and what to order.

## Getting Around
2-3 bullet points on transport tips that save time or money.

Tone: warm, specific, opinionated, conversational. Sound like a real human friend.
Skip generic tourist advice. Give insider knowledge a friend would share over coffee."""


async def generate_briefing(city: str) -> str:
    client = _get_client()
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Give me your local guide for: {city}"},
        ],
        max_tokens=900,
        temperature=0.75,
    )
    return response.choices[0].message.content


async def moderate_content(text: str) -> dict:
    """
    Use OpenAI's free moderation endpoint to screen text for hate, harassment,
    violence, sexual content, self-harm, etc.

    Returns:
        {
          "flagged": bool,
          "categories": list[str]  # which categories tripped (e.g. ["hate", "violence"])
        }
    """
    client = _get_client()
    response = await client.moderations.create(
        model="omni-moderation-latest",
        input=text,
    )
    result = response.results[0]
    cats = result.categories.model_dump() if hasattr(result.categories, "model_dump") else dict(result.categories)
    flagged_categories = [name for name, value in cats.items() if value]
    return {"flagged": bool(result.flagged), "categories": flagged_categories}
