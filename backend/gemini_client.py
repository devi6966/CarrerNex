"""
gemini_client.py
-----------------
Thread-safe round-robin Gemini API key rotator.

- Loads keys from environment variables (GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3).
- Each call returns a configured Gemini GenerativeModel using the next key in rotation.
- Automatically handles model fallback (gemini-1.5-flash, gemini-2.0-flash, gemini-1.5-pro).
- If a key hits a rate limit (429) or API error, automatically retries with the next key.
"""

import os
import threading
import time
from typing import Optional, List
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, GoogleAPICallError
from dotenv import load_dotenv

load_dotenv()

# ── Load keys ─────────────────────────────────────────────────────────────────
_API_KEYS: list[str] = [
    k for k in [
        os.getenv("GEMINI_API_KEY_1"),
        os.getenv("GEMINI_API_KEY_2"),
        os.getenv("GEMINI_API_KEY_3"),
    ]
    if k and k.strip() and not k.startswith("your_")  # filter out placeholder strings
]

# ── Candidate Model Hierarchy (tries first available active model) ───────────
_PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
GEMINI_MODELS: list[str] = [
    _PRIMARY_MODEL,
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-3.6-flash",
]
# Remove duplicates preserving order
GEMINI_MODELS = list(dict.fromkeys(GEMINI_MODELS))

# ── Thread-safe round-robin index ────────────────────────────────────────────
_lock = threading.Lock()
_current_index = 0


def _next_key() -> str:
    """Return the next API key in round-robin order (thread-safe)."""
    global _current_index
    if not _API_KEYS:
        raise RuntimeError(
            "No valid Gemini API keys found. "
            "Set GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3 in your backend/.env file."
        )
    with _lock:
        key = _API_KEYS[_current_index % len(_API_KEYS)]
        _current_index += 1
        return key


def generate_with_fallback(
    prompt: str,
    system_instruction: Optional[str] = None,
    chat_history: Optional[List[dict]] = None,
    max_retries: Optional[int] = None,
) -> str:
    """
    Send a prompt to Gemini using the next available API key and model fallback.
    Retries through all keys and model variants on rate-limit or API errors.

    Args:
        prompt: The user message / prompt text.
        system_instruction: Optional system prompt for the model.
        chat_history: Optional list of prior messages for chat continuation.
                      Format: [{"role": "user"|"model", "parts": ["text"]}]
        max_retries: Max attempts before raising. Defaults to (keys * models).

    Returns:
        The model's text response as a string.

    Raises:
        RuntimeError: If all keys/models are exhausted without a successful response.
    """
    if not _API_KEYS:
        raise RuntimeError(
            "No valid Gemini API keys found. "
            "Set GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_3 in your backend/.env file."
        )

    if max_retries is None:
        max_retries = len(_API_KEYS) * len(GEMINI_MODELS)

    last_error: Optional[Exception] = None

    for attempt in range(max_retries):
        api_key = _next_key()
        model_name = GEMINI_MODELS[attempt % len(GEMINI_MODELS)]

        try:
            genai.configure(api_key=api_key)

            model_kwargs: dict = {"model_name": model_name}
            if system_instruction:
                model_kwargs["system_instruction"] = system_instruction

            model = genai.GenerativeModel(**model_kwargs)

            if chat_history:
                chat = model.start_chat(history=chat_history)  # type: ignore[arg-type]
                response = chat.send_message(prompt)

            else:
                response = model.generate_content(prompt)

            if response and hasattr(response, "text") and response.text:
                return response.text
            elif response and hasattr(response, "parts"):
                return "".join(p.text for p in response.parts if hasattr(p, "text"))

        except ResourceExhausted as e:
            # Rate limit hit (429) — try next key after a short delay
            last_error = e
            time.sleep(0.6)
            continue

        except GoogleAPICallError as e:
            # Other API errors (quota exceeded, model not found, invalid key)
            last_error = e
            time.sleep(0.4)
            continue

        except Exception as e:
            last_error = e
            time.sleep(0.4)
            continue

    raise RuntimeError(
        f"All {len(_API_KEYS)} Gemini API keys / models failed. "
        f"Last error: {last_error}"
    )
