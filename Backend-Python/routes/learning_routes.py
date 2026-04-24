"""Routes apprentissage — quêtes, progression, badges, leaderboard."""
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from database import db
from models import Quest, QuestProgress, User
from auth import jwt_required, jwt_required_optional

learning_bp = Blueprint("learning", __name__)


@learning_bp.get("/quests")
@jwt_required_optional
def list_quests():
    language = request.args.get("language")
    level = request.args.get("level")
    query = Quest.query
    if language:
        query = query.filter_by(language_code=language)
    if level:
        query = query.filter_by(level=level)
    quests = [q.to_dict() for q in query.all()]

    # Si user authentifié → ajout progression
    if g.current_user:
        progresses = {p.quest_id: p for p in QuestProgress.query.filter_by(user_id=g.current_user.id).all()}
        for q in quests:
            p = progresses.get(q["id"])
            q["progress"] = p.to_dict() if p else None

    return jsonify({"quests": quests})


@learning_bp.get("/quests/<int:quest_id>")
def get_quest(quest_id):
    quest = Quest.query.get_or_404(quest_id)
    return jsonify({"quest": quest.to_dict()})


@learning_bp.post("/quests/<int:quest_id>/start")
@jwt_required
def start_quest(quest_id):
    Quest.query.get_or_404(quest_id)
    progress = QuestProgress.query.filter_by(user_id=g.current_user.id, quest_id=quest_id).first()
    if not progress:
        progress = QuestProgress(user_id=g.current_user.id, quest_id=quest_id)
        db.session.add(progress)
    progress.started_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"progress": progress.to_dict()})


@learning_bp.post("/quests/<int:quest_id>/complete")
@jwt_required
def complete_quest(quest_id):
    quest = Quest.query.get_or_404(quest_id)
    data = request.get_json(silent=True) or {}
    score = int(data.get("score", 100))

    progress = QuestProgress.query.filter_by(user_id=g.current_user.id, quest_id=quest_id).first()
    if not progress:
        progress = QuestProgress(user_id=g.current_user.id, quest_id=quest_id)
        db.session.add(progress)

    if not progress.completed:
        progress.completed = True
        progress.completed_at = datetime.utcnow()
        progress.score = score
        # Reward XP
        g.current_user.xp += quest.xp_reward
        g.current_user.streak += 1
        db.session.commit()

    return jsonify({
        "progress": progress.to_dict(),
        "user": g.current_user.to_dict(),
        "xpGained": quest.xp_reward,
    })


@learning_bp.get("/leaderboard")
def leaderboard():
    rows = User.query.order_by(User.xp.desc()).limit(20).all()
    return jsonify({
        "leaderboard": [
            {"rank": i + 1, "name": u.name, "avatar": u.avatar, "country": u.country, "xp": u.xp}
            for i, u in enumerate(rows)
        ]
    })


@learning_bp.get("/badges")
@jwt_required
def my_badges():
    """Calcule les badges débloqués selon les stats."""
    u = g.current_user
    badges = []
    if u.xp >= 100:
        badges.append({"id": "first-step", "icon": "🚀", "name": "Premier pas", "description": "100 XP atteints"})
    if u.xp >= 1000:
        badges.append({"id": "explorer", "icon": "🌍", "name": "Explorateur", "description": "1000 XP atteints"})
    if u.xp >= 5000:
        badges.append({"id": "polyglot", "icon": "👑", "name": "Polyglotte", "description": "5000 XP — vrai champion"})
    if u.streak >= 7:
        badges.append({"id": "week-streak", "icon": "🔥", "name": "Série de 7 jours", "description": "7 jours d'affilée"})
    if u.streak >= 30:
        badges.append({"id": "month-streak", "icon": "💎", "name": "Mois complet", "description": "30 jours d'affilée"})
    if u.contributions_count >= 1:
        badges.append({"id": "contributor", "icon": "❤️", "name": "Contributeur", "description": "Première contribution culturelle"})
    return jsonify({"badges": badges})
