"""
Authentification Bearer Token (JWT) — middleware Flask.
Sessions sécurisées par utilisateur.
"""

from datetime import datetime, timezone
from functools import wraps

import jwt
from flask import request, jsonify, current_app, g


def encode_token(user_id: int) -> str:
    """Génère un JWT Bearer pour l'utilisateur."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + current_app.config["JWT_EXPIRATION"],
        "iss": "kivu-api",
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")


def decode_token(token: str):
    """Vérifie un JWT et renvoie le payload (None si invalide/expiré)."""
    try:
        return jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def _extract_token():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    return None


def jwt_required(fn):
    """Routes qui nécessitent un Bearer valide."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        from models.user import User  # import local pour éviter les cycles

        token = _extract_token()
        if not token:
            return jsonify({"error": "Unauthorized", "message": "Bearer token requis"}), 401

        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Unauthorized", "message": "Token invalide ou expiré"}), 401

        user = User.query.get(int(payload["sub"]))
        if not user:
            return jsonify({"error": "Unauthorized", "message": "Utilisateur introuvable"}), 401

        g.current_user = user
        return fn(*args, **kwargs)
    return wrapper


def jwt_required_optional(fn):
    """Routes où l'auth est facultative (g.current_user peut être None)."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        from models.user import User

        g.current_user = None
        token = _extract_token()
        if token:
            payload = decode_token(token)
            if payload:
                g.current_user = User.query.get(int(payload["sub"]))
        return fn(*args, **kwargs)
    return wrapper
