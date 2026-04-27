"""
Routes /api/v1/sync — synchronisation cloud du state client.

Endpoints :
  GET  /sync/pull            → renvoie le dernier blob du user
  POST /sync/push            → enregistre un nouveau blob (last-write-wins)

Le payload est libre côté client (preferences, lessons, receipts, etc.).
Le serveur ne valide que la structure JSON. Versionné via 'version'.
"""

import json
from flask import Blueprint, request, jsonify, g
from database import db
from auth import jwt_required
from models.sync_blob import UserSyncBlob

sync_bp = Blueprint("sync", __name__)


@sync_bp.get("/pull")
@jwt_required
def pull():
    """Renvoie le dernier état serveur du user."""
    blob = UserSyncBlob.query.filter_by(user_id=g.current_user.id).first()
    if not blob:
        return jsonify({
            "version": 0,
            "updatedAt": None,
            "payload": {},
            "exists": False,
        })
    data = blob.to_dict()
    data["exists"] = True
    return jsonify(data)


@sync_bp.post("/push")
@jwt_required
def push():
    """
    Sauve un nouveau blob côté serveur.
    Body attendu : { "payload": { ...client state... }, "clientVersion": <int>? }

    Stratégie : last-write-wins. Si le serveur a une version > clientVersion,
    on renvoie 'conflict' avec le state serveur — le client peut alors merge.
    """
    data = request.get_json(silent=True) or {}
    payload = data.get("payload")
    client_version = int(data.get("clientVersion") or 0)

    if not isinstance(payload, dict):
        return jsonify({"error": "ValidationError",
                        "message": "payload must be a JSON object"}), 400

    blob = UserSyncBlob.query.filter_by(user_id=g.current_user.id).first()

    # Conflict detection (optional, opt-in via clientVersion)
    if blob and client_version and blob.version > client_version:
        return jsonify({
            "status": "conflict",
            "serverVersion": blob.version,
            "serverPayload": json.loads(blob.payload_json or "{}"),
            "serverUpdatedAt": blob.updated_at.isoformat() if blob.updated_at else None,
        }), 409

    if not blob:
        blob = UserSyncBlob(user_id=g.current_user.id, payload_json="{}", version=0)
        db.session.add(blob)

    try:
        blob.payload_json = json.dumps(payload, ensure_ascii=False)
    except (TypeError, ValueError) as e:
        return jsonify({"error": "ValidationError",
                        "message": f"payload not JSON-serializable: {e}"}), 400
    blob.version = (blob.version or 0) + 1
    db.session.commit()

    return jsonify({
        "status": "ok",
        "version": blob.version,
        "updatedAt": blob.updated_at.isoformat() if blob.updated_at else None,
    })


@sync_bp.delete("/")
@jwt_required
def delete_blob():
    """Supprime tout le state serveur du user (RGPD-style)."""
    blob = UserSyncBlob.query.filter_by(user_id=g.current_user.id).first()
    if blob:
        db.session.delete(blob)
        db.session.commit()
    return jsonify({"status": "deleted"})
