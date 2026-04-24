"""Modèle Langue — 2000+ langues africaines + monde."""
from datetime import datetime
from database import db


class Language(db.Model):
    __tablename__ = "languages"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(8), unique=True, nullable=False, index=True)  # ISO 639-3 ou propre
    name = db.Column(db.String(120), nullable=False)
    native_name = db.Column(db.String(120))
    flag = db.Column(db.String(8), default="🌍")
    family = db.Column(db.String(60))  # niger-congo, afro-asiatic, nilo-saharan, indo-european...
    region = db.Column(db.String(80))
    speakers = db.Column(db.Integer, default=0)  # Nombre estimé de locuteurs
    status = db.Column(db.String(30), default="vivant")  # vivant|menacé|critique|endangered
    offline_supported = db.Column(db.Boolean, default=False)

    description = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "nativeName": self.native_name,
            "flag": self.flag,
            "family": self.family,
            "region": self.region,
            "speakers": self.speakers,
            "status": self.status,
            "offlineSupported": self.offline_supported,
            "description": self.description,
        }
