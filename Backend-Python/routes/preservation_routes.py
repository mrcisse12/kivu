"""Routes préservation culturelle — archives, contes, proverbes."""
from flask import Blueprint, request, jsonify, g
from database import db
from models import Archive, Language
from auth import jwt_required, jwt_required_optional

preservation_bp = Blueprint("preservation", __name__)


@preservation_bp.get("/archives")
def list_archives():
    category = request.args.get("category")
    language = request.args.get("language")
    endangered_only = request.args.get("endangered") in ("1", "true")

    q = Archive.query
    if category:
        q = q.filter_by(category=category)
    if language:
        q = q.filter_by(language_code=language)
    if endangered_only:
        q = q.filter_by(is_endangered=True)

    return jsonify({"archives": [a.to_dict() for a in q.order_by(Archive.created_at.desc()).limit(100).all()]})


@preservation_bp.post("/archives")
@jwt_required
def create_archive():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "ValidationError", "message": "title requis"}), 400

    lang = Language.query.filter_by(code=data.get("languageCode", "")).first()
    is_endangered = bool(lang and lang.status in ("menacé", "critique"))

    archive = Archive(
        user_id=g.current_user.id,
        title=title,
        description=data.get("description", ""),
        category=data.get("category", "conte"),
        language_code=data.get("languageCode", "fra"),
        media_type=data.get("mediaType", "audio"),
        media_url=data.get("mediaUrl", ""),
        duration_sec=int(data.get("durationSec", 0)),
        transcription=data.get("transcription", ""),
        contributor_name=data.get("contributorName", g.current_user.name),
        contributor_age=int(data.get("contributorAge", 0)),
        region=data.get("region", g.current_user.country),
        is_endangered=is_endangered,
    )
    db.session.add(archive)
    g.current_user.contributions_count += 1
    g.current_user.xp += 200
    db.session.commit()

    return jsonify({"archive": archive.to_dict(), "xpGained": 200}), 201


@preservation_bp.get("/archives/<int:arch_id>")
def get_archive(arch_id):
    arch = Archive.query.get_or_404(arch_id)
    arch.plays += 1
    db.session.commit()
    return jsonify({"archive": arch.to_dict()})


@preservation_bp.post("/archives/<int:arch_id>/like")
@jwt_required
def like_archive(arch_id):
    arch = Archive.query.get_or_404(arch_id)
    arch.likes += 1
    db.session.commit()
    return jsonify({"likes": arch.likes})


@preservation_bp.get("/stats")
def stats():
    total = Archive.query.count()
    endangered = Archive.query.filter_by(is_endangered=True).count()
    by_category = {}
    for cat in ["conte", "proverbe", "chanson", "cérémonie", "recette", "histoire"]:
        by_category[cat] = Archive.query.filter_by(category=cat).count()
    return jsonify({
        "totalArchives": total,
        "endangeredArchives": endangered,
        "byCategory": by_category,
    })
