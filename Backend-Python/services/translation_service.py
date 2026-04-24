"""
Service de traduction KIVU.
- Si OPENAI_API_KEY est défini → utilise gpt-4o-mini.
- Sinon → utilise un dictionnaire propriétaire (fallback hors-ligne).
"""

import os
import time
from typing import Optional

from utils.dictionary import dictionary_translate, detect_language_heuristic


def _openai_translate(text: str, source: str, target: str) -> Optional[str]:
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        prompt = (
            f"Translate the following text from {source} to {target}. "
            f"Preserve cultural nuance. Return only the translation, no explanation.\n\n"
            f"Text: {text}"
        )
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are KIVU — a translator specialized in African languages."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=600,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[KIVU] OpenAI fallback (offline): {e}")
        return None


def translate(text: str, source_language: str, target_language: str) -> dict:
    """
    Renvoie un dict { translatedText, confidence, offline, sourceLanguage, durationMs }.
    """
    started = time.time()
    src = source_language or "auto"
    if src == "auto":
        src = detect_language_heuristic(text) or "fra"

    if src == target_language:
        return {
            "translatedText": text,
            "sourceLanguage": src,
            "targetLanguage": target_language,
            "confidence": 1.0,
            "offline": True,
            "durationMs": int((time.time() - started) * 1000),
        }

    # 1) Tentative OpenAI
    online = _openai_translate(text, src, target_language)
    if online:
        return {
            "translatedText": online,
            "sourceLanguage": src,
            "targetLanguage": target_language,
            "confidence": 0.97,
            "offline": False,
            "durationMs": int((time.time() - started) * 1000),
        }

    # 2) Fallback dictionnaire propriétaire (hors-ligne)
    offline = dictionary_translate(text, src, target_language)
    return {
        "translatedText": offline,
        "sourceLanguage": src,
        "targetLanguage": target_language,
        "confidence": 0.78,
        "offline": True,
        "durationMs": int((time.time() - started) * 1000),
    }
