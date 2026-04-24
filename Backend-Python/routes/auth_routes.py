"""Routes auth — signup, signin, me. JWT Bearer."""
from flask import Blueprint, request, jsonify, g
from database import db
from models import User
from auth import encode_token, jwt_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/signup")
def signup():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name = (data.get("name") or "").strip() or "Utilisateur KIVU"

    if not email or not password:
        return jsonify({"error": "ValidationError", "message": "email et password requis"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Conflict", "message": "Email déjà utilisé"}), 409

    user = User(
        email=email,
        name=name,
        avatar=data.get("avatar", "🌍"),
        country=data.get("country", ""),
        country_flag=data.get("countryFlag", "🌍"),
        mother_tongue=data.get("motherTongue", "fra"),
        preferred_language=data.get("preferredLanguage", "fra"),
        learning_languages=",".join(data.get("learningLanguages", []) or []),
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"token": encode_token(user.id), "user": user.to_dict()}), 201


@auth_bp.post("/signin")
def signin():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Unauthorized", "message": "Identifiants invalides"}), 401

    return jsonify({"token": encode_token(user.id), "user": user.to_dict()}), 200


@auth_bp.get("/me")
@jwt_required
def me():
    return jsonify({"user": g.current_user.to_dict()}), 200
