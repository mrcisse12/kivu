"""Modèle Archive — Préservation culturelle (audio, vidéo, conte, proverbe)."""
from datetime import datetime
from database import db


class Archive(db.Model):
    __tablename__ = "archives"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)

    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(40), default="conte")  # conte|proverbe|chanson|cérémonie|recette|histoire
    language_code = db.Column(db.String(8), nullable=False, index=True)

    media_type = db.Column(db.String(20), default="audio")  # audio|video|text|image
    media_url = db.Column(db.String(500), default="")
    duration_sec = db.Column(db.Integer, default=0)

    transcription = db.Column(db.Text, default="")
    translations_json = db.Column(db.Text, default="{}")  # {"fra":"...","eng":"..."}

    contributor_name = db.Column(db.String(120), default="")
    contributor_age = db.Column(db.Integer, default=0)
    region = db.Column(db.String(120), default="")

    is_endangered = db.Column(db.Boolean, default=False)
    plays = db.Column(db.Integer, default=0)
    likes = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        import json
        try:
            translations = json.loads(self.translations_json or "{}")
        except json.JSONDecodeError:
            translations = {}
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "languageCode": self.language_code,
            "mediaType": self.media_type,
            "mediaUrl": self.media_url,
            "durationSec": self.duration_sec,
            "transcription": self.transcription,
            "translations": translations,
            "contributor": {
                "name": self.contributor_name,
                "age": self.contributor_age,
                "region": self.region,
            },
            "isEndangered": self.is_endangered,
            "plays": self.plays,
            "likes": self.likes,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
