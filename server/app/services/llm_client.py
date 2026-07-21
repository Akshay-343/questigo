"""Provider-flexible LLM client.

Both Groq and OpenAI expose the same OpenAI-compatible REST API, so a single
`openai.OpenAI` client works for either — only base_url / model / key change
(env-driven, see app.core.config). Groq is the default because it's free.
"""
import json
from functools import lru_cache

from openai import OpenAI

from app.core.config import settings
from app.core.errors import AppError


@lru_cache
def _client() -> OpenAI:
    if not settings.ai_enabled:
        raise AppError("AI generation is not configured (no AI_API_KEY).", status_code=503)
    return OpenAI(api_key=settings.ai_api_key, base_url=settings.ai_base_url)


# Quest payloads (especially multi-question arena rounds) run long. Without an
# explicit ceiling the provider cuts the completion short, which fails JSON-mode
# validation before we ever see the content.
MAX_COMPLETION_TOKENS = 8000


def generate_json(system_prompt: str, user_prompt: str) -> dict:
    """Call the configured chat model in JSON mode and return the parsed object.

    Raises AppError on any provider/parse failure so the route returns the
    standard error envelope.
    """
    try:
        resp = _client().chat.completions.create(
            model=settings.ai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=MAX_COMPLETION_TOKENS,
        )
        content = resp.choices[0].message.content or "{}"
    except AppError:
        raise
    except Exception as exc:  # provider/network errors
        raise AppError(f"AI provider request failed: {exc}", status_code=502)

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        raise AppError("AI returned malformed JSON.", status_code=502)
