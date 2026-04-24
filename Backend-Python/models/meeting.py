"""Modèles Meeting & MeetingParticipant — Communication multi-parties temps réel."""
from datetime import datetime
import secrets
from database import db


class Meeting(db.Model):
    __tablename__ = "meetings"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(12), unique=True, default=lambda: secrets.token_urlsafe(6).upper()[:8])
    host_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(200), default="Réunion KIVU")
    template = db.Column(db.String(40), default="business")  # business|family|education|health|peace
    status = db.Column(db.String(20), default="scheduled")  # scheduled|active|ended

    started_at = db.Column(db.DateTime, nullable=True)
    ended_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    participants = db.relationship("MeetingParticipant", backref="meeting", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "hostId": self.host_id,
            "title": self.title,
            "template": self.template,
            "status": self.status,
            "participants": [p.to_dict() for p in self.participants],
            "startedAt": self.started_at.isoformat() if self.started_at else None,
            "endedAt": self.ended_at.isoformat() if self.ended_at else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class MeetingParticipant(db.Model):
    __tablename__ = "meeting_participants"

    id = db.Column(db.Integer, primary_key=True)
    meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    name = db.Column(db.String(120), default="Invité")
    language_code = db.Column(db.String(8), default="fra")
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    left_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "meetingId": self.meeting_id,
            "userId": self.user_id,
            "name": self.name,
            "languageCode": self.language_code,
            "joinedAt": self.joined_at.isoformat() if self.joined_at else None,
            "leftAt": self.left_at.isoformat() if self.left_at else None,
        }
