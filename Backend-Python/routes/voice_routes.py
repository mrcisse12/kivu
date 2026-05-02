"""
KIVU — Voix premium IA (TTS neural haute qualité).

Trois fournisseurs supportés :
  1. ElevenLabs (multilingual_v2) — meilleure qualité pour les langues africaines
  2. OpenAI TTS-1-HD              — voix anglais/français très expressives
  3. Pas de fallback ici          — le frontend fait Web Speech API si rien

Cache disque : chaque audio synthétisé est stocké en MP3 dans
data/voice_cache/{sha256(text+lang+provider+voice)}.mp3 et servi
directement aux requêtes ultérieures pour zéro coût + zéro latence.

Endpoint :
  POST /api/v1/voice/synthesize  { text, lang, voicePreset?, model? }
       → audio/mpeg (binaire)
  GET  /api/v1/voice/status        → { elevenlabs:bool, openai:bool, languages:[] }
  GET  /api/v1/voice/voices        → presets dispo par langue
"""
import os
import io
import hashlib
import json
from flask import Blueprint, request, jsonify, Response

voice_bp = Blueprint("voice", __name__)

# Disk cache directory (data/voice_cache)
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "voice_cache")
os.makedirs(CACHE_DIR, exist_ok=True)

# ────────────────────────────────────────────────────────────
# Voice presets per language
#
# OpenAI TTS voices : alloy, echo, fable, onyx, nova, shimmer
#   - nova / shimmer  = chaleureuses féminines (Kivi vibe)
#   - onyx            = grave masculine (langues à tons graves)
#   - echo            = neutre masculine
#
# ElevenLabs voice IDs : choisir dans la voice library
#   https://elevenlabs.io/app/voice-library
#
# Pour des accents AFRICAINS authentiques, configurez les voice IDs
# via des variables d'environnement, par exemple :
#   ELEVENLABS_VOICE_SWA=<id-d-une-voix-swahili-cloned>
#   ELEVENLABS_VOICE_WOL=<id-voix-wolof>
#   ELEVENLABS_VOICE_HAU=<id-voix-haoussa>
#
# Sans override, les valeurs par défaut sont des voix multilingues
# de la bibliothèque ElevenLabs (multilingual_v2 prend l'accent du
# texte plutôt bien, surtout pour swahili/yoruba/lingala).
# ────────────────────────────────────────────────────────────

# Defaults (publicly available ElevenLabs voices that work multilingually)
DEFAULT_VOICES = {
    "warm_female":   "XB0fDUnXU5powFXDhCwa",  # Charlotte — chaleureuse
    "bright_female": "EXAVITQu4vr4xnSDxMaL",  # Bella    — vive
    "deep_male":     "pqHfZKP75CvOlQylNhV4",  # Bill     — grave
    "young_male":    "VR6AewLTigWG4xSOukaG",  # Arnold   — jeune
    "expressive":    "Xb7hH8MSUJpSbSDYk0k2",  # Alice    — expressive
}

def _env_voice(lang_code, fallback):
    """Allow runtime override of any voice via ELEVENLABS_VOICE_<LANG>."""
    return os.environ.get(f"ELEVENLABS_VOICE_{lang_code.upper()}", fallback)


LANG_PRESETS = {
    # African languages — multilingual_v2 + region-flavored defaults
    "swa": {"openai": "shimmer", "elevenlabs": _env_voice("swa", DEFAULT_VOICES["bright_female"])},
    "wol": {"openai": "shimmer", "elevenlabs": _env_voice("wol", DEFAULT_VOICES["warm_female"])},
    "bam": {"openai": "shimmer", "elevenlabs": _env_voice("bam", DEFAULT_VOICES["warm_female"])},
    "dyu": {"openai": "shimmer", "elevenlabs": _env_voice("dyu", DEFAULT_VOICES["warm_female"])},
    "hau": {"openai": "onyx",    "elevenlabs": _env_voice("hau", DEFAULT_VOICES["deep_male"])},
    "yor": {"openai": "shimmer", "elevenlabs": _env_voice("yor", DEFAULT_VOICES["bright_female"])},
    "zul": {"openai": "shimmer", "elevenlabs": _env_voice("zul", DEFAULT_VOICES["bright_female"])},
    "ibo": {"openai": "shimmer", "elevenlabs": _env_voice("ibo", DEFAULT_VOICES["bright_female"])},
    "lin": {"openai": "shimmer", "elevenlabs": _env_voice("lin", DEFAULT_VOICES["warm_female"])},
    "amh": {"openai": "shimmer", "elevenlabs": _env_voice("amh", DEFAULT_VOICES["expressive"])},
    # World languages
    "fra": {"openai": "shimmer", "elevenlabs": _env_voice("fra", DEFAULT_VOICES["warm_female"])},
    "eng": {"openai": "nova",    "elevenlabs": _env_voice("eng", DEFAULT_VOICES["bright_female"])},
    "ara": {"openai": "shimmer", "elevenlabs": _env_voice("ara", DEFAULT_VOICES["expressive"])},
    "por": {"openai": "shimmer", "elevenlabs": _env_voice("por", DEFAULT_VOICES["warm_female"])},
    # KIVI's signature voice (used by frontend speakAsKivi for the AI assistant)
    "kivi": {"openai": "nova",   "elevenlabs": _env_voice("kivi", DEFAULT_VOICES["warm_female"])},
}

OPENAI_MODEL = "tts-1-hd"  # higher-quality (vs tts-1)
ELEVENLABS_MODEL = "eleven_multilingual_v2"


def _cache_path(text: str, lang: str, provider: str, voice: str) -> str:
    """Stable cache file path for a (text, lang, provider, voice) tuple."""
    key = f"{provider}:{voice}:{lang}:{text.strip().lower()}"
    h = hashlib.sha256(key.encode("utf-8")).hexdigest()[:32]
    return os.path.join(CACHE_DIR, f"{h}.mp3")


# ─── Provider 1: OpenAI TTS ────────────────────────────────

def _openai_tts(text: str, voice: str = "nova") -> bytes | None:
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        # OpenAI TTS API returns iter_bytes via streaming; collect into bytes
        with client.audio.speech.with_streaming_response.create(
            model=OPENAI_MODEL,
            voice=voice,
            input=text,
            response_format="mp3",
            speed=1.0,
        ) as response:
            buf = io.BytesIO()
            for chunk in response.iter_bytes():
                buf.write(chunk)
            return buf.getvalue()
    except Exception as e:
        print(f"[KIVU Voice] OpenAI TTS error: {e}")
        return None


# ─── Provider 2: ElevenLabs ────────────────────────────────

def _elevenlabs_tts(text: str, voice_id: str) -> bytes | None:
    api_key = os.environ.get("ELEVENLABS_API_KEY", "")
    if not api_key:
        return None
    try:
        import requests
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        resp = requests.post(
            url,
            headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            json={
                "text": text,
                "model_id": ELEVENLABS_MODEL,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.4,
                    "use_speaker_boost": True,
                },
            },
            timeout=20,
        )
        if resp.status_code == 200:
            return resp.content
        else:
            print(f"[KIVU Voice] ElevenLabs HTTP {resp.status_code}: {resp.text[:200]}")
            return None
    except Exception as e:
        print(f"[KIVU Voice] ElevenLabs error: {e}")
        return None


# ─── Endpoints ─────────────────────────────────────────────

@voice_bp.post("/synthesize")
def synthesize():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    lang = (data.get("lang") or "fra").lower()
    if not text:
        return jsonify({"error": "text required"}), 400
    if len(text) > 1000:
        return jsonify({"error": "text too long (max 1000 chars)"}), 400

    presets = LANG_PRESETS.get(lang, LANG_PRESETS["eng"])
    el_voice = presets.get("elevenlabs")
    oai_voice = presets.get("openai", "nova")

    # 1) Cache lookup — try ElevenLabs cache first, then OpenAI cache
    if el_voice:
        cached = _cache_path(text, lang, "elevenlabs", el_voice)
        if os.path.exists(cached):
            with open(cached, "rb") as f:
                return Response(
                    f.read(),
                    mimetype="audio/mpeg",
                    headers={
                        "X-Voice-Provider": "elevenlabs",
                        "X-Voice-Cache": "HIT",
                        "Cache-Control": "public, max-age=31536000, immutable",
                    },
                )
    cached_oai = _cache_path(text, lang, "openai", oai_voice)
    if os.path.exists(cached_oai):
        with open(cached_oai, "rb") as f:
            return Response(
                f.read(),
                mimetype="audio/mpeg",
                headers={
                    "X-Voice-Provider": "openai",
                    "X-Voice-Cache": "HIT",
                    "Cache-Control": "public, max-age=31536000, immutable",
                },
            )

    # 2) Try ElevenLabs first (better multilingual quality)
    audio = None
    provider = None
    voice_used = None
    if el_voice:
        audio = _elevenlabs_tts(text, el_voice)
        if audio:
            provider = "elevenlabs"
            voice_used = el_voice

    # 3) Fallback to OpenAI TTS
    if not audio:
        audio = _openai_tts(text, oai_voice)
        if audio:
            provider = "openai"
            voice_used = oai_voice

    if not audio:
        return jsonify({
            "error": "No TTS provider configured",
            "hint": "Set ELEVENLABS_API_KEY or OPENAI_API_KEY environment variable on the backend"
        }), 503

    # 4) Cache to disk
    try:
        out_path = _cache_path(text, lang, provider, voice_used)
        with open(out_path, "wb") as f:
            f.write(audio)
    except Exception as e:
        print(f"[KIVU Voice] cache write error: {e}")

    return Response(
        audio,
        mimetype="audio/mpeg",
        headers={
            "X-Voice-Provider": provider,
            "X-Voice-Cache": "MISS",
            "X-Voice-Voice": str(voice_used),
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    )


@voice_bp.get("/status")
def status():
    """Frontend uses this to know if premium voices are available."""
    el_ok = bool(os.environ.get("ELEVENLABS_API_KEY"))
    oai_ok = bool(os.environ.get("OPENAI_API_KEY"))
    cached_count = 0
    cached_bytes = 0
    try:
        for fname in os.listdir(CACHE_DIR):
            fp = os.path.join(CACHE_DIR, fname)
            if os.path.isfile(fp):
                cached_count += 1
                cached_bytes += os.path.getsize(fp)
    except Exception:
        pass
    return jsonify({
        "available": el_ok or oai_ok,
        "providers": {
            "elevenlabs": el_ok,
            "openai": oai_ok,
        },
        "preferred": "elevenlabs" if el_ok else ("openai" if oai_ok else None),
        "languages": list(LANG_PRESETS.keys()),
        "cache": {
            "count": cached_count,
            "bytes": cached_bytes,
        }
    })


@voice_bp.get("/voices")
def voices():
    """Returns the voice presets per language so the frontend can show metadata."""
    return jsonify(LANG_PRESETS)
