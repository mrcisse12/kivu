"""
Modèle UserSyncBlob — stockage générique de l'état client (preferences,
progression leçons, reçus, enregistrements meta, etc.) sous forme de JSON.

Permet une synchronisation Cloud sans coupler le backend à chaque champ
spécifique du client. Le serveur arbitre via 'updated_at' (last-write-wins).
"""

from datetime import datetime
import json

from database import db


class UserSyncBlob(db.Model):
    __tablename__ = "user_sync_blobs"

    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False, index=True)
    payload_json = db.Column(db.Text, nullable=False, default="{}")
    version     = db.Column(db.Integer, default=1)        # incrémenté à chaque push
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("sync_blob", uselist=False))

    def to_dict(self):
        try:
            payload = json.loads(self.payload_json or "{}")
        except Exception:
            payload = {}
        return {
            "version": self.version,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "payload": payload,
        }
