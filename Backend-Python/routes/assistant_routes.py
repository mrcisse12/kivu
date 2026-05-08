"""Routes AI Assistant — tuteur conversationnel KIVU haute performance.

Hiérarchie des fournisseurs :
  1. Anthropic Claude Sonnet 4.5 (préféré — qualité multilingue)
  2. OpenAI gpt-4o (fallback si pas de clé Anthropic)
  3. Réponses pré-calculées hors-ligne (dernier recours)

Chaque fournisseur reçoit le même prompt système enrichi avec le
contexte de l'utilisateur (prénom, langue cible, niveau, série).

Endpoints :
  POST /chat        → réponse complète d'un coup (JSON)
  POST /chat/stream → réponse en streaming (Server-Sent Events)
  GET  /suggestions → 10 prompts d'exemple
"""
import os
import json
from flask import Blueprint, request, jsonify, Response, stream_with_context
from auth import jwt_required_optional

assistant_bp = Blueprint("assistant", __name__)

# ─── Modèles ─────────────────────────────────────────────────
ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929"
OPENAI_MODEL = "gpt-4o"

# ─── Prompt système haute performance ────────────────────────

def build_system_prompt(user_context: dict, target_language: str = "fra") -> str:
    """Build the system prompt, injecting user context for personalization."""
    name = user_context.get("name") or ""
    level = user_context.get("level") or ""
    learning = user_context.get("learning") or target_language
    mother = user_context.get("motherTongue") or "fra"
    streak = user_context.get("streak") or 0
    xp = user_context.get("xp") or 0

    persona = (
        "Tu es Kivi, l'assistant IA de KIVU — la plateforme africaine "
        "dédiée aux 2 000+ langues du continent. Tu es à la fois tuteur "
        "de langues, guide culturel et assistant universel. Tu réponds "
        "à toutes les questions avec clarté, profondeur et bienveillance.\n\n"

        "# Domaines d'expertise principale\n"
        "- Langues africaines : grammaire, vocabulaire, prononciation, "
        "dialectes, étymologie. Spécialement Swahili, Wolof, Bambara, "
        "Dioula, Haoussa, Yoruba, Zulu, Igbo, Lingala, Amharique, "
        "Peul, Berbère, Akan, Twi, Éwé, Songhaï, et bien d'autres.\n"
        "- Cultures, histoires et traditions des 54 pays d'Afrique.\n"
        "- Géographie, économie, art, musique, littérature, cuisine.\n"
        "- Diaspora africaine et contributions mondiales.\n"
        "- Préservation linguistique et patrimoine immatériel.\n"
        "- Pédagogie : méthodes, mnémotechniques, exercices personnalisés.\n\n"

        "# Capacités générales\n"
        "Tu réponds aussi sur tous les sujets : sciences, technologie, "
        "mathématiques, philosophie, code, conseils de vie, créativité, "
        "écriture, etc. Tu es polyvalent comme un grand modèle généraliste.\n\n"

        "# Style de réponse\n"
        "- Chaleureux, encourageant, jamais condescendant.\n"
        "- Structure claire avec Markdown : ## titres, listes à puces, "
        "**gras**, *italique*, `code inline`, blocs ``` pour le code.\n"
        "- Adapte la longueur : 1-3 phrases pour une salutation ou question "
        "simple ; réponse complète et structurée pour une question complexe.\n"
        "- Donne des exemples concrets, des comparaisons, des cas d'usage.\n"
        "- Utilise les emojis avec parcimonie (max 2-3 par réponse, "
        "pour rythmer pas pour décorer).\n"
        "- Pour une langue africaine, fournis la prononciation phonétique "
        "[entre crochets] si elle n'est pas évidente.\n"
        "- Cite les sources/régions/locuteurs quand c'est pertinent.\n\n"

        "# Règles strictes\n"
        "- Si tu ne sais pas, dis-le honnêtement plutôt qu'inventer.\n"
        "- Réponds dans la langue de l'utilisateur (français par défaut).\n"
        "- N'invente pas de mots dans une langue africaine que tu ignores.\n"
        "- Encourage les progrès, célèbre les efforts.\n"
        "- Reste concentré sur la question — n'invente pas de digressions.\n"
        "- Pour le code : produits du code clair et commenté.\n"
    )

    # Inject user context
    ctx_lines = ["\n# Contexte de l'utilisateur"]
    if name:
        ctx_lines.append(f"- Prénom : {name}")
    if mother:
        ctx_lines.append(f"- Langue maternelle : {mother}")
    if learning and learning != mother:
        ctx_lines.append(f"- Apprend actuellement : {learning}")
    if level:
        ctx_lines.append(f"- Niveau déclaré : {level}")
    if streak:
        ctx_lines.append(f"- Série en cours : {streak} jour{'s' if streak != 1 else ''}")
    if xp:
        ctx_lines.append(f"- XP accumulé : {xp}")
    ctx_lines.append(
        "\nUtilise ce contexte pour personnaliser tes réponses (par exemple, "
        f"appelle l'utilisateur par son prénom de temps en temps si fourni). "
        f"La langue principale de la conversation est : {target_language}."
    )

    return persona + "\n" + "\n".join(ctx_lines)


# ─── Fournisseur 1 : Anthropic Claude Sonnet 4.5 ─────────────

def _anthropic_chat(messages, system_msg):
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        # Anthropic expects messages without `system` role — system is separate.
        clean = [m for m in messages if m.get("role") in ("user", "assistant")]
        resp = client.messages.create(
            model=ANTHROPIC_MODEL,
            system=system_msg,
            messages=clean,
            temperature=0.7,
            max_tokens=4096,
        )
        # resp.content is a list of blocks; gather text
        text = "".join(
            block.text for block in resp.content
            if hasattr(block, "text")
        ).strip()
        return text or None
    except Exception as e:
        print(f"[KIVU Assistant] Anthropic error: {e}")
        return None


# ─── Fournisseur 2 : OpenAI gpt-4o ───────────────────────────

def _openai_chat(messages, system_msg):
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        resp = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "system", "content": system_msg}, *messages],
            temperature=0.7,
            max_tokens=4096,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[KIVU Assistant] OpenAI error: {e}")
        return None


# ─── Fournisseur 3 : Réponses offline ─────────────────────────

def _offline_reply(last_message: str) -> str:
    last = (last_message or "").lower()
    if any(w in last for w in ("bonjour", "hello", "salut", "hi ", "hey")):
        return ("Bonjour ! Je suis Kivi, ton tuteur KIVU. 🌍\n\n"
                "Le serveur IA est actuellement hors ligne, mais je suis "
                "toujours là pour t'aider. Que veux-tu apprendre aujourd'hui ?")
    if any(w in last for w in ("merci", "thank")):
        return "De rien ! Continue tes efforts, tu progresses bien. ✨"
    if "?" in last:
        return ("Excellente question ! Le serveur IA est temporairement "
                "indisponible — réessaie dans quelques instants pour une "
                "réponse complète. En attendant, explore les leçons et "
                "le dictionnaire. 📚")
    return ("Je suis Kivi, ton tuteur. Le serveur IA est hors ligne pour "
            "le moment — réessaie dans quelques instants pour une réponse "
            "complète et personnalisée.")


# ─── Endpoint principal ──────────────────────────────────────

@assistant_bp.post("/chat")
@jwt_required_optional
def chat():
    data = request.get_json(silent=True) or {}
    messages = data.get("messages", []) or []
    target = data.get("targetLanguage", "fra")
    user_context = data.get("userContext", {}) or {}

    # Cap conversation history to last 20 turns to stay within token budgets
    if len(messages) > 20:
        messages = messages[-20:]

    system_msg = build_system_prompt(user_context, target)

    # Try Anthropic first (Sonnet 4.5 > gpt-4o for nuanced multilingual)
    reply = _anthropic_chat(messages, system_msg)
    provider = "anthropic" if reply else None

    if not reply:
        reply = _openai_chat(messages, system_msg)
        if reply:
            provider = "openai"

    if not reply:
        last = messages[-1].get("content", "") if messages else ""
        reply = _offline_reply(last)
        provider = "offline"

    return jsonify({
        "reply": reply,
        "language": target,
        "provider": provider,
        "model": ANTHROPIC_MODEL if provider == "anthropic"
                 else OPENAI_MODEL if provider == "openai"
                 else "offline"
    })


# ─── Streaming endpoint (Server-Sent Events) ─────────────────

def _anthropic_stream(messages, system_msg):
    """Yields text chunks from Anthropic streaming API."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        clean = [m for m in messages if m.get("role") in ("user", "assistant")]

        def generator():
            try:
                with client.messages.stream(
                    model=ANTHROPIC_MODEL,
                    system=system_msg,
                    messages=clean,
                    temperature=0.7,
                    max_tokens=4096,
                ) as stream:
                    for text in stream.text_stream:
                        yield text
            except Exception as e:
                print(f"[KIVU Assistant] Anthropic stream error: {e}")
                yield ""
        return generator
    except Exception as e:
        print(f"[KIVU Assistant] Anthropic stream init error: {e}")
        return None


def _openai_stream(messages, system_msg):
    """Yields text chunks from OpenAI streaming API."""
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)

        def generator():
            try:
                resp = client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=[{"role": "system", "content": system_msg}, *messages],
                    temperature=0.7,
                    max_tokens=4096,
                    stream=True,
                )
                for chunk in resp:
                    delta = chunk.choices[0].delta.content if chunk.choices else None
                    if delta:
                        yield delta
            except Exception as e:
                print(f"[KIVU Assistant] OpenAI stream error: {e}")
                yield ""
        return generator
    except Exception as e:
        print(f"[KIVU Assistant] OpenAI stream init error: {e}")
        return None


@assistant_bp.post("/chat/stream")
@jwt_required_optional
def chat_stream():
    """Streams the reply via Server-Sent Events.

    Output format (each line):
      data: {"chunk": "Hello"}\n\n
      data: {"chunk": " world"}\n\n
      data: {"done": true, "provider": "anthropic", "model": "..."}\n\n
    """
    data = request.get_json(silent=True) or {}
    messages = data.get("messages", []) or []
    target = data.get("targetLanguage", "fra")
    user_context = data.get("userContext", {}) or {}

    if len(messages) > 20:
        messages = messages[-20:]

    system_msg = build_system_prompt(user_context, target)

    # Pick the best available provider
    gen_factory = _anthropic_stream(messages, system_msg)
    provider = "anthropic" if gen_factory else None
    if not gen_factory:
        gen_factory = _openai_stream(messages, system_msg)
        if gen_factory:
            provider = "openai"

    def stream_response():
        if gen_factory:
            try:
                for chunk in gen_factory():
                    if chunk:
                        yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                used_model = ANTHROPIC_MODEL if provider == "anthropic" else OPENAI_MODEL
                yield f"data: {json.dumps({'done': True, 'provider': provider, 'model': used_model})}\n\n"
            except Exception as e:
                err_msg = str(e)
                yield f"data: {json.dumps({'error': err_msg, 'provider': provider})}\n\n"
        else:
            # No streaming provider available — emit offline reply as a single chunk
            last = messages[-1].get("content", "") if messages else ""
            reply = _offline_reply(last)
            yield f"data: {json.dumps({'chunk': reply})}\n\n"
            yield f"data: {json.dumps({'done': True, 'provider': 'offline', 'model': 'offline'})}\n\n"

    return Response(
        stream_with_context(stream_response()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering for true streaming
            "Connection": "keep-alive",
        }
    )


# ─── Endpoint suggestions ────────────────────────────────────

@assistant_bp.get("/suggestions")
def suggestions():
    return jsonify({"prompts": [
        "Apprends-moi le Swahili pour voyager en Tanzanie",
        "Raconte-moi un proverbe Bambara avec sa morale",
        "Comment dit-on 'Je t'aime' en Wolof, Yoruba et Zulu ?",
        "Quelles sont les origines du Lingala ?",
        "Explique-moi la différence entre Bambara et Dioula",
        "Donne-moi 5 phrases utiles pour le marché de Dakar",
        "Quels sont les contes traditionnels les plus connus en Afrique de l'Ouest ?",
        "Aide-moi à mémoriser les chiffres 1 à 20 en Haoussa",
        "Quelle est l'histoire du Royaume du Mali ?",
        "Donne-moi un exercice de prononciation en Yoruba",
    ]})
