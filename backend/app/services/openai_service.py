import os
from openai import AsyncOpenAI

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


SYSTEM_PROMPT = """You are a savvy cultural intelligence analyst for urban travelers.
Given a city name, produce a concise briefing covering:
1. Vibe & character (2-3 sentences)
2. Must-know cultural norms & etiquette (3-5 bullet points)
3. Insider neighborhood tips (3-4 bullet points)
4. Food & drink essentials (3-4 bullet points)
5. Transport & practical tips (2-3 bullet points)

Be specific, practical, and opinionated. Avoid generic tourist advice.
Respond in clean markdown."""


async def generate_briefing(city: str) -> str:
    client = _get_client()
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Give me a cultural intelligence briefing for: {city}"},
        ],
        max_tokens=800,
        temperature=0.7,
    )
    return response.choices[0].message.content
