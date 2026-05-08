"""Routes traduction — temps réel + historique."""
import os
from flask import Blueprint, request, jsonify, g
from database import db
from models import Translation
from services.translation_service import translate
from auth import jwt_required, jwt_required_optional

translation_bp = Blueprint("translation", __name__)


@translation_bp.get("/status")
def translation_status():
    """Returns which translation providers are available."""
    return jsonify({
        "providers": {
            "anthropic": bool(os.environ.get("ANTHROPIC_API_KEY")),
            "openai":    bool(os.environ.get("OPENAI_API_KEY")),
            "libretranslate": True,  # public, always available (best-effort)
            "dictionary": True,
        },
        "preferred": (
            "anthropic" if os.environ.get("ANTHROPIC_API_KEY")
            else "openai" if os.environ.get("OPENAI_API_KEY")
            else "libretranslate"
        )
    })


@translation_bp.post("/translate")
@jwt_required_optional
def translate_route():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    source = data.get("sourceLanguage", "auto")
    target = data.get("targetLanguage", "fra")
    mode = data.get("mode", "text")

    if not text:
        return jsonify({"error": "ValidationError", "message": "text requis"}), 400

    result = translate(text, source, target)

    # Sauvegarde si user authentifié
    if g.current_user:
        record = Translation(
            user_id=g.current_user.id,
            source_text=text,
            translated_text=result["translatedText"],
            source_language=result["sourceLanguage"],
            target_language=result["targetLanguage"],
            mode=mode,
            confidence=result["confidence"],
            offline=result["offline"],
            duration_ms=result["durationMs"],
        )
        db.session.add(record)
        db.session.commit()
        result["id"] = record.id

    return jsonify(result), 200


@translation_bp.get("/history")
@jwt_required
def history():
    limit = min(int(request.args.get("limit", 50)), 200)
    rows = Translation.query.filter_by(user_id=g.current_user.id) \
        .order_by(Translation.created_at.desc()).limit(limit).all()
    return jsonify({"translations": [r.to_dict() for r in rows]}), 200


@translation_bp.delete("/history/<int:tr_id>")
@jwt_required
def delete_one(tr_id):
    tr = Translation.query.filter_by(id=tr_id, user_id=g.current_user.id).first()
    if not tr:
        return jsonify({"error": "NotFound"}), 404
    db.session.delete(tr)
    db.session.commit()
    return jsonify({"deleted": True}), 200
