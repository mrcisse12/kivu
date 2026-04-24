"""Configuration centrale de l'application Flask KIVU."""

import os
from datetime import timedelta


BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    """Configuration de base."""
    # Sécurité
    SECRET_KEY = os.environ.get("SECRET_KEY", "kivu-dev-secret-change-in-production")
    JWT_SECRET = os.environ.get("JWT_SECRET", "kivu-jwt-secret-change-in-production")
    JWT_EXPIRATION = timedelta(days=int(os.environ.get("JWT_EXPIRATION_DAYS", 30)))
    BCRYPT_ROUNDS = 12

    # Base de données SQLite
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'kivu.db')}"
    )
    # Render fournit DATABASE_URL en postgres:// — SQLAlchemy 2.x veut postgresql://
    if SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # CORS
    CORS_ORIGINS = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:4173,https://kivu.vercel.app"
    ).split(",")

    # Uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB

    # Rate limiting (en mémoire pour dev, Redis en prod)
    RATELIMIT_DEFAULT = "500 per 15 minutes"

    # OpenAI (optionnel — fallback heuristique si absent)
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")


class ProductionConfig(Config):
    SQLALCHEMY_ECHO = False


class DevelopmentConfig(Config):
    SQLALCHEMY_ECHO = False
