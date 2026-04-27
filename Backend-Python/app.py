"""
KIVU — Backend Python (Flask + SQLAlchemy + SQLite)
Plateforme mondiale de traduction & apprentissage linguistique.
Conçu pour Science Fest Africa 2026.
"""

import os
from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from config import Config
from database import db
from auth import jwt_required_optional

# Routes (blueprints)
from routes.auth_routes import auth_bp
from routes.translation_routes import translation_bp
from routes.language_routes import language_bp
from routes.learning_routes import learning_bp
from routes.preservation_routes import preservation_bp
from routes.business_routes import business_bp
from routes.diaspora_routes import diaspora_bp
from routes.assistant_routes import assistant_bp
from routes.user_routes import user_bp
from routes.economics_routes import economics_bp
from routes.sync_routes import sync_bp

# Force-import models so db.create_all() picks them up
import models  # noqa: F401


def create_app(config_class=Config):
    """Factory Flask — pattern recommandé."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # CORS — permettre frontend Vercel + dev local
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # DB
    db.init_app(app)

    # Enregistrement des blueprints
    api_prefix = "/api/v1"
    app.register_blueprint(auth_bp, url_prefix=f"{api_prefix}/auth")
    app.register_blueprint(translation_bp, url_prefix=f"{api_prefix}/translation")
    app.register_blueprint(language_bp, url_prefix=f"{api_prefix}/languages")
    app.register_blueprint(learning_bp, url_prefix=f"{api_prefix}/learning")
    app.register_blueprint(preservation_bp, url_prefix=f"{api_prefix}/preservation")
    app.register_blueprint(business_bp, url_prefix=f"{api_prefix}/business")
    app.register_blueprint(diaspora_bp, url_prefix=f"{api_prefix}/diaspora")
    app.register_blueprint(assistant_bp, url_prefix=f"{api_prefix}/assistant")
    app.register_blueprint(user_bp, url_prefix=f"{api_prefix}/users")
    app.register_blueprint(economics_bp, url_prefix=f"{api_prefix}/economics")
    app.register_blueprint(sync_bp, url_prefix=f"{api_prefix}/sync")

    # Health check
    @app.route("/")
    @app.route("/api/v1/health")
    def health():
        return jsonify({
            "status": "ok",
            "name": "KIVU Backend (Python/Flask)",
            "version": "1.0.0",
            "features": [
                "translation", "learning", "preservation",
                "business", "multiparty", "assistant",
                "diaspora", "accessibility"
            ]
        })

    # Gestion globale des erreurs
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        return jsonify({
            "error": e.name,
            "message": e.description,
            "status": e.code
        }), e.code

    @app.errorhandler(Exception)
    def handle_generic_exception(e):
        if isinstance(e, HTTPException):
            return handle_http_exception(e)
        app.logger.exception(e)
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

    # Création des tables au démarrage si elles n'existent pas
    with app.app_context():
        db.create_all()
        # Auto-seed des langues si vide
        from utils.seed import seed_if_empty
        seed_if_empty()

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
