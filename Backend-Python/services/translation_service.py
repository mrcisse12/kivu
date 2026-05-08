"""
Service de traduction KIVU — qualité DeepL/Google Translate.

Hiérarchie des fournisseurs (du plus qualitatif au fallback) :
  1. Anthropic Claude Sonnet 4.5 (PRÉFÉRÉ — excellent multilingue,
     supérieur à DeepL pour les langues africaines et nuances culturelles)
  2. OpenAI gpt-4o (fallback si pas de clé Anthropic)
  3. LibreTranslate public (fallback gratuit, qualité moyenne)
  4. Dictionnaire propriétaire offline (dernier recours pour les
     langues africaines couvertes)
"""

import os
import time
import json
from typing import Optional

from utils.dictionary import dictionary_translate, detect_language_heuristic


# ─── Mapping des codes langue KIVU vers noms complets ───────
LANG_NAMES = {
    "auto": "auto-detect",
    "fra":  "French (Français)",
    "eng":  "English",
    "ara":  "Arabic (العربية)",
    "por":  "Portuguese (Português)",
    "spa":  "Spanish (Español)",
    "deu":  "German (Deutsch)",
    "ita":  "Italian (Italiano)",
    "rus":  "Russian (Русский)",
    "jpn":  "Japanese (日本語)",
    "kor":  "Korean (한국어)",
    "zho":  "Chinese (中文)",
    "hin":  "Hindi (हिन्दी)",
    "tur":  "Turkish (Türkçe)",
    # Langues africaines
    "swa":  "Swahili (Kiswahili)",
    "wol":  "Wolof",
    "bam":  "Bambara (Bamanankan)",
    "dyu":  "Dioula (Jula)",
    "hau":  "Hausa (Haoussa)",
    "yor":  "Yoruba (Yorùbá)",
    "zul":  "Zulu (isiZulu)",
    "ibo":  "Igbo (Asụsụ Igbo)",
    "lin":  "Lingala (Lingála)",
    "amh":  "Amharic (አማርኛ)",
    "som":  "Somali",
    "afr":  "Afrikaans",
    "xho":  "Xhosa (isiXhosa)",
    "sna":  "Shona",
    "fuf":  "Pulaar / Fula (Peul)",
    "tw":   "Twi",
    "ee":   "Ewe",
    "kin":  "Kinyarwanda",
    "lug":  "Luganda",
    "tir":  "Tigrinya (ትግርኛ)",
    "orm":  "Oromo",
    "berb": "Berber (Tamazight)",
}


def _lang_label(code: str) -> str:
    return LANG_NAMES.get(code, code)


def _build_translation_prompt(text: str, source: str, target: str) -> str:
    """Build a prompt that tells the LLM exactly how to translate."""
    src_label = _lang_label(source) if source != "auto" else "auto-detect (figure it out from the text)"
    tgt_label = _lang_label(target)
    return (
        f"You are a professional translator. Translate the following text "
        f"from **{src_label}** to **{tgt_label}**.\n\n"
        f"### Rules\n"
        f"- Preserve cultural nuance, tone, register, and idiomatic expressions\n"
        f"- For African languages: use the most authentic, natural form spoken by native speakers\n"
        f"- For tonal languages (Yoruba, Igbo, Zulu): include tone marks where relevant\n"
        f"- Do NOT translate proper nouns (names, places, brands)\n"
        f"- Do NOT add any explanation, preamble, or footnote\n"
        f"- Output ONLY the translation as a single response\n"
        f"- If the text is already in the target language, return it unchanged\n\n"
        f"### Text to translate\n{text}"
    )


# ─── Provider 1 : Anthropic Claude Sonnet 4.5 ───────────────

def _anthropic_translate(text: str, source: str, target: str) -> Optional[str]:
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        prompt = _build_translation_prompt(text, source, target)
        resp = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            system=(
                "You are KIVU's translation engine — specialized in African languages "
                "and 100+ world languages. You produce DeepL-quality translations with "
                "cultural sensitivity. Output ONLY the translation, no commentary."
            ),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2000,
        )
        text_out = "".join(b.text for b in resp.content if hasattr(b, "text")).strip()
        return text_out or None
    except Exception as e:
        print(f"[KIVU Translate] Anthropic error: {e}")
        return None


# ─── Provider 2 : OpenAI gpt-4o ──────────────────────────────

def _openai_translate(text: str, source: str, target: str) -> Optional[str]:
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        prompt = _build_translation_prompt(text, source, target)
        resp = client.chat.completions.create(
            model="gpt-4o",  # upgraded from mini for better quality
            messages=[
                {"role": "system", "content": (
                    "You are KIVU's translation engine — specialized in African languages "
                    "and 100+ world languages. Output ONLY the translation, no commentary."
                )},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=2000,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[KIVU Translate] OpenAI error: {e}")
        return None


# ─── Provider 3 : LibreTranslate (gratuit, public) ───────────

# Mapping des codes KIVU vers les codes LibreTranslate (ISO 639-1 souvent)
LIBRE_CODES = {
    "fra": "fr", "eng": "en", "ara": "ar", "por": "pt", "spa": "es",
    "deu": "de", "ita": "it", "rus": "ru", "jpn": "ja", "kor": "ko",
    "zho": "zh", "hin": "hi", "tur": "tr",
    "swa": "sw",  # only African lang in LibreTranslate
}

def _libretranslate(text: str, source: str, target: str) -> Optional[str]:
    """Free public LibreTranslate instance — last-resort online provider."""
    src_code = LIBRE_CODES.get(source)
    tgt_code = LIBRE_CODES.get(target)
    if not src_code or not tgt_code:
        return None  # not supported
    try:
        import requests
        # Try multiple public instances in case one is down
        instances = [
            "https://libretranslate.com/translate",
            "https://translate.argosopentech.com/translate",
            "https://libretranslate.de/translate",
        ]
        for url in instances:
            try:
                resp = requests.post(url, json={
                    "q": text,
                    "source": src_code,
                    "target": tgt_code,
                    "format": "text",
                }, timeout=8)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("translatedText")
            except Exception:
                continue
        return None
    except Exception as e:
        print(f"[KIVU Translate] LibreTranslate error: {e}")
        return None


# ─── Main entry point ──────────────────────────────────────

def translate(text: str, source_language: str, target_language: str) -> dict:
    """
    Returns { translatedText, sourceLanguage, targetLanguage,
              confidence, offline, provider, durationMs }
    """
    started = time.time()
    src = source_language or "auto"
    if src == "auto":
        src = detect_language_heuristic(text) or "fra"

    # No-op : same source and target
    if src == target_language:
        return {
            "translatedText": text,
            "sourceLanguage": src,
            "targetLanguage": target_language,
            "confidence": 1.0,
            "offline": True,
            "provider": "noop",
            "durationMs": int((time.time() - started) * 1000),
        }

    # 1) Anthropic Sonnet 4.5 (best quality, including African languages)
    online = _anthropic_translate(text, src, target_language)
    provider = "anthropic"

    # 2) OpenAI gpt-4o
    if not online:
        online = _openai_translate(text, src, target_language)
        if online:
            provider = "openai"

    # 3) LibreTranslate (free public instance)
    if not online:
        online = _libretranslate(text, src, target_language)
        if online:
            provider = "libretranslate"

    if online:
        return {
            "translatedText": online,
            "sourceLanguage": src,
            "targetLanguage": target_language,
            "confidence": 0.97 if provider == "anthropic" else 0.95 if provider == "openai" else 0.85,
            "offline": False,
            "provider": provider,
            "durationMs": int((time.time() - started) * 1000),
        }

    # 4) Last resort: offline dictionary (limited to KIVU's 80 entries)
    offline = dictionary_translate(text, src, target_language)
    return {
        "translatedText": offline,
        "sourceLanguage": src,
        "targetLanguage": target_language,
        "confidence": 0.55,
        "offline": True,
        "provider": "dictionary",
        "durationMs": int((time.time() - started) * 1000),
    }
