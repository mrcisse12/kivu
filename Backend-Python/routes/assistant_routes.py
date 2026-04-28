"""Routes AI Assistant — tuteur personnel conversationnel."""
import os
from flask import Blueprint, request, jsonify, g
from auth import jwt_required_optional

assistant_bp = Blueprint("assistant", __name__)


def _anthropic_chat(messages, target_language="fra"):
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key or os.environ.get("OPENAI_API_KEY", ""):
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        system_msg = (
            f"Tu es KIVU, un tuteur bienveillant spécialisé dans les langues africaines. "
            f"Tu enseignes de manière naturelle et contextuelle en {target_language}. "
            f"Tu encourages, tu corriges avec douceur, tu célèbres les progrès."
        )
        resp = client.messages.create(
            model="claude-3-5-haiku-20241022",
            system=system_msg,
            messages=messages,
            temperature=0.7,
            max_tokens=500,
        )
        return resp.content[0].text.strip()
    except Exception as e:
        print(f"[KIVU Assistant] Anthropic fallback: {e}")
        return None


def _openai_chat(messages, target_language="fra"):
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return None
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        system_msg = (
            f"Tu es KIVU, un tuteur bienveillant spécialisé dans les langues africaines. "
            f"Tu enseignes de manière naturelle et contextuelle en {target_language}. "
            f"Tu encourages, tu corriges avec douceur, tu célèbres les progrès."
        )
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_msg}, *messages],
            temperature=0.7,
            max_tokens=500,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[KIVU Assistant] fallback: {e}")
        return None


@assistant_bp.post("/chat")
@jwt_required_optional
def chat():
    data = request.get_json(silent=True) or {}
    messages = data.get("messages", [])
    target = data.get("targetLanguage", "fra")

    reply = _openai_chat(messages, target) or _anthropic_chat(messages, target)
    if not reply:
        # Réponses offline pré-calculées
        last = (messages[-1].get("content", "") if messages else "").lower()
        if "bonjour" in last or "hello" in last:
            reply = "Bonjour ! Prêt(e) pour votre leçon du jour ? 🌍"
        elif "merci" in last or "thank" in last:
            reply = "De rien ! Vous progressez magnifiquement. Continuez ! ✨"
        elif "?" in last:
            reply = "Excellente question ! Essayons de répondre ensemble. Reformule en 3 mots ?"
        else:
            reply = "Je suis KIVU, votre tuteur bienveillant. Que voulez-vous apprendre aujourd'hui ?"

    return jsonify({"reply": reply, "language": target})


@assistant_bp.get("/suggestions")
def suggestions():
    return jsonify({"prompts": [
        "Apprends-moi le Swahili pour voyager en Tanzanie",
        "Raconte-moi un proverbe Bambara",
        "Comment dit-on 'Je t'aime' en Wolof ?",
        "Aide-moi à préparer mon voyage à Dakar",
        "Parle-moi de la culture Bissa",
        "Teste mon niveau en Yoruba",
    ]})
