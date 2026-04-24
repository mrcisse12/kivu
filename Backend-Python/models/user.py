"""Modèle utilisateur KIVU."""
from datetime import datetime
import bcrypt

from database import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(120), nullable=False)
    avatar = db.Column(db.String(8), default="🌍")
    country = db.Column(db.String(80), default="")
    country_flag = db.Column(db.String(8), default="🌍")

    # Langues — stockées par code ISO
    mother_tongue = db.Column(db.String(8), default="fra")
    preferred_language = db.Column(db.String(8), default="fra")
    learning_languages = db.Column(db.String(255), default="")  # CSV: "swa,wol,bam"

    # Subscription
    subscription = db.Column(db.String(20), default="free")  # free|starter|pro|family|enterprise

    # Stats apprentissage
    xp = db.Column(db.Integer, default=0)
    streak = db.Column(db.Integer, default=0)
    badges_count = db.Column(db.Integer, default=0)
    contributions_count = db.Column(db.Integer, default=0)
    rank = db.Column(db.Integer, default=999999)

    # Préférences accessibilité
    high_contrast = db.Column(db.Boolean, default=False)
    font_size = db.Column(db.Float, default=1.0)
    voice_control = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ----- Helpers mot de passe -----
    def set_password(self, plain: str):
        self.password_hash = bcrypt.hashpw(
            plain.encode("utf-8"),
            bcrypt.gensalt(rounds=12)
        ).decode("utf-8")

    def check_password(self, plain: str) -> bool:
        try:
            return bcrypt.checkpw(plain.encode("utf-8"), self.password_hash.encode("utf-8"))
        except Exception:
            return False

    # ----- Sérialisation -----
    def to_dict(self, with_email=True):
        data = {
            "id": self.id,
            "name": self.name,
            "avatar": self.avatar,
            "country": self.country,
            "countryFlag": self.country_flag,
            "motherTongue": self.mother_tongue,
            "preferredLanguage": self.preferred_language,
            "learningLanguages": [l for l in (self.learning_languages or "").split(",") if l],
            "subscription": self.subscription,
            "stats": {
                "xp": self.xp,
                "streak": self.streak,
                "badgesCount": self.badges_count,
                "contributionsCount": self.contributions_count,
                "rank": self.rank,
            },
            "preferences": {
                "highContrast": self.high_contrast,
                "fontSize": self.font_size,
                "voiceControl": self.voice_control,
            },
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
        if with_email:
            data["email"] = self.email
        return data
