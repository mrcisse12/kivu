"""Routes diaspora — arbre familial, héritage, histoires familiales."""
from flask import Blueprint, request, jsonify, g
from auth import jwt_required, jwt_required_optional

diaspora_bp = Blueprint("diaspora", __name__)

# Les données familiales étant sensibles, on les mémorise en session JSON pour le MVP
FAMILY_STORE = {}


@diaspora_bp.get("/family")
@jwt_required
def get_family():
    tree = FAMILY_STORE.get(g.current_user.id, {
        "members": [],
        "cities": [],
    })
    return jsonify({"family": tree})


@diaspora_bp.post("/family/members")
@jwt_required
def add_member():
    data = request.get_json(silent=True) or {}
    tree = FAMILY_STORE.setdefault(g.current_user.id, {"members": [], "cities": []})
    member = {
        "id": len(tree["members"]) + 1,
        "name": data.get("name", ""),
        "relation": data.get("relation", ""),
        "language": data.get("language", "fra"),
        "city": data.get("city", ""),
        "flag": data.get("flag", "🌍"),
        "avatar": data.get("avatar", "👤"),
    }
    tree["members"].append(member)
    if data.get("city") and data["city"] not in tree["cities"]:
        tree["cities"].append(data["city"])
    return jsonify({"member": member, "family": tree}), 201


@diaspora_bp.get("/heritage")
@jwt_required_optional
def heritage_journey():
    """Parcours héritage 30 jours — leçon quotidienne."""
    day = int(request.args.get("day", 1))
    lessons = [
        {"day": 1, "title": "Salutations ancestrales", "icon": "🌅", "duration": 10},
        {"day": 2, "title": "Proverbe du jour", "icon": "📜", "duration": 5},
        {"day": 3, "title": "Conte du soir", "icon": "🌙", "duration": 15},
        {"day": 4, "title": "Vocabulaire famille", "icon": "👨‍👩‍👧‍👦", "duration": 12},
        {"day": 5, "title": "Chanson traditionnelle", "icon": "🎵", "duration": 8},
    ]
    return jsonify({"lessons": lessons, "currentDay": day, "totalDays": 30})
