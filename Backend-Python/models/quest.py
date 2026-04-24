"""Modèles Quest (apprentissage gamifié) & QuestProgress."""
from datetime import datetime
import json
from database import db


class Quest(db.Model):
    __tablename__ = "quests"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    language_code = db.Column(db.String(8), index=True)
    level = db.Column(db.String(20), default="beginner")  # beginner|intermediate|advanced
    icon = db.Column(db.String(8), default="📚")
    xp_reward = db.Column(db.Integer, default=100)
    duration_min = db.Column(db.Integer, default=10)

    # Étapes JSON: [{type, prompt, options, answer, hint}]
    steps_json = db.Column(db.Text, default="[]")

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def steps(self):
        try:
            return json.loads(self.steps_json or "[]")
        except json.JSONDecodeError:
            return []

    @steps.setter
    def steps(self, value):
        self.steps_json = json.dumps(value, ensure_ascii=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "languageCode": self.language_code,
            "level": self.level,
            "icon": self.icon,
            "xpReward": self.xp_reward,
            "durationMin": self.duration_min,
            "steps": self.steps,
        }


class QuestProgress(db.Model):
    __tablename__ = "quest_progress"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    quest_id = db.Column(db.Integer, db.ForeignKey("quests.id"), nullable=False, index=True)

    completed = db.Column(db.Boolean, default=False)
    score = db.Column(db.Integer, default=0)
    step_index = db.Column(db.Integer, default=0)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "questId": self.quest_id,
            "completed": self.completed,
            "score": self.score,
            "stepIndex": self.step_index,
            "startedAt": self.started_at.isoformat() if self.started_at else None,
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
        }
