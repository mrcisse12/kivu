"""Modèle Traduction — historique de toutes les traductions effectuées."""
from datetime import datetime
from database import db


class Translation(db.Model):
    __tablename__ = "translations"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)

    source_text = db.Column(db.Text, nullable=False)
    translated_text = db.Column(db.Text, nullable=False)
    source_language = db.Column(db.String(8), nullable=False)
    target_language = db.Column(db.String(8), nullable=False)

    mode = db.Column(db.String(20), default="text")  # text|voice|conversation
    confidence = db.Column(db.Float, default=0.95)
    offline = db.Column(db.Boolean, default=False)
    duration_ms = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "sourceText": self.source_text,
            "translatedText": self.translated_text,
            "sourceLanguage": self.source_language,
            "targetLanguage": self.target_language,
            "mode": self.mode,
            "confidence": self.confidence,
            "offline": self.offline,
            "durationMs": self.duration_ms,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
