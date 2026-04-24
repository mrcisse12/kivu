"""Routes langues — lister, filtrer, voir détail."""
from flask import Blueprint, request, jsonify
from models import Language

language_bp = Blueprint("language", __name__)


@language_bp.get("/")
def list_languages():
    q = request.args.get("q", "").strip().lower()
    family = request.args.get("family")
    status = request.args.get("status")
    endangered = request.args.get("endangered")  # "1"/"true" → menacé+critique

    query = Language.query
    if q:
        query = query.filter(
            (Language.name.ilike(f"%{q}%")) |
            (Language.native_name.ilike(f"%{q}%")) |
            (Language.code.ilike(f"%{q}%"))
        )
    if family:
        query = query.filter_by(family=family)
    if status:
        query = query.filter_by(status=status)
    if endangered in ("1", "true", "yes"):
        query = query.filter(Language.status.in_(["menacé", "critique", "endangered"]))

    return jsonify({"languages": [l.to_dict() for l in query.order_by(Language.speakers.desc()).all()]})


@language_bp.get("/<code>")
def get_language(code):
    lang = Language.query.filter_by(code=code).first_or_404()
    return jsonify({"language": lang.to_dict()})


@language_bp.get("/stats/overview")
def stats_overview():
    total = Language.query.count()
    endangered = Language.query.filter(Language.status.in_(["menacé", "critique"])).count()
    offline = Language.query.filter_by(offline_supported=True).count()
    total_speakers = sum(l.speakers or 0 for l in Language.query.all())
    return jsonify({
        "totalLanguages": total,
        "endangered": endangered,
        "offlineSupported": offline,
        "totalSpeakers": total_speakers,
    })
