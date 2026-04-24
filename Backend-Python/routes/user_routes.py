"""Routes utilisateur — profil, préférences, abonnement."""
from flask import Blueprint, request, jsonify, g
from database import db
from auth import jwt_required

user_bp = Blueprint("user", __name__)


@user_bp.patch("/me")
@jwt_required
def update_me():
    data = request.get_json(silent=True) or {}
    u = g.current_user
    for field, attr in [
        ("name", "name"),
        ("avatar", "avatar"),
        ("country", "country"),
        ("countryFlag", "country_flag"),
        ("motherTongue", "mother_tongue"),
        ("preferredLanguage", "preferred_language"),
    ]:
        if field in data:
            setattr(u, attr, data[field])
    if "learningLanguages" in data:
        u.learning_languages = ",".join(data["learningLanguages"] or [])
    db.session.commit()
    return jsonify({"user": u.to_dict()})


@user_bp.patch("/me/preferences")
@jwt_required
def update_prefs():
    data = request.get_json(silent=True) or {}
    u = g.current_user
    for field, attr in [
        ("highContrast", "high_contrast"),
        ("fontSize", "font_size"),
        ("voiceControl", "voice_control"),
    ]:
        if field in data:
            setattr(u, attr, data[field])
    db.session.commit()
    return jsonify({"preferences": u.to_dict()["preferences"]})


@user_bp.post("/me/subscription")
@jwt_required
def update_subscription():
    data = request.get_json(silent=True) or {}
    plan = data.get("plan", "free")
    if plan not in ("free", "starter", "pro", "family", "enterprise"):
        return jsonify({"error": "ValidationError", "message": "plan invalide"}), 400
    g.current_user.subscription = plan
    db.session.commit()
    return jsonify({"subscription": plan, "user": g.current_user.to_dict()})
