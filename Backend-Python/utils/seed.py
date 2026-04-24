"""Seed automatique : langues + quêtes de démo."""
from database import db
from models import Language, Quest


LANGUAGE_SEED = [
    # Africaines majeures
    {"code": "swa", "name": "Swahili", "native_name": "Kiswahili", "flag": "🇹🇿", "family": "niger-congo", "region": "Afrique de l'Est", "speakers": 200_000_000, "status": "vivant", "offline_supported": True},
    {"code": "wol", "name": "Wolof", "native_name": "Wolof", "flag": "🇸🇳", "family": "niger-congo", "region": "Sénégal", "speakers": 12_000_000, "status": "vivant", "offline_supported": True},
    {"code": "bam", "name": "Bambara", "native_name": "Bamanankan", "flag": "🇲🇱", "family": "niger-congo", "region": "Mali", "speakers": 14_000_000, "status": "vivant", "offline_supported": True},
    {"code": "dyu", "name": "Dioula", "native_name": "Julakan", "flag": "🇨🇮", "family": "niger-congo", "region": "Côte d'Ivoire", "speakers": 12_000_000, "status": "vivant", "offline_supported": True},
    {"code": "lin", "name": "Lingala", "native_name": "Lingála", "flag": "🇨🇩", "family": "niger-congo", "region": "RDC, Congo", "speakers": 70_000_000, "status": "vivant", "offline_supported": True},
    {"code": "yor", "name": "Yoruba", "native_name": "Yorùbá", "flag": "🇳🇬", "family": "niger-congo", "region": "Nigeria, Bénin", "speakers": 47_000_000, "status": "vivant", "offline_supported": True},
    {"code": "hau", "name": "Haoussa", "native_name": "Harshen Hausa", "flag": "🇳🇬", "family": "afro-asiatic", "region": "Nigeria, Niger", "speakers": 80_000_000, "status": "vivant", "offline_supported": True},
    {"code": "amh", "name": "Amharique", "native_name": "አማርኛ", "flag": "🇪🇹", "family": "afro-asiatic", "region": "Éthiopie", "speakers": 57_000_000, "status": "vivant", "offline_supported": True},
    {"code": "zul", "name": "Zoulou", "native_name": "isiZulu", "flag": "🇿🇦", "family": "niger-congo", "region": "Afrique du Sud", "speakers": 12_000_000, "status": "vivant", "offline_supported": True},
    {"code": "ibo", "name": "Igbo", "native_name": "Asụsụ Igbo", "flag": "🇳🇬", "family": "niger-congo", "region": "Nigeria", "speakers": 27_000_000, "status": "vivant", "offline_supported": True},

    # Endangered — ce que KIVU sauve en priorité
    {"code": "bis", "name": "Bissa", "native_name": "Bissa", "flag": "🇧🇫", "family": "niger-congo", "region": "Burkina Faso", "speakers": 50_000, "status": "menacé", "offline_supported": True, "description": "Langue mandé — environ 50 000 locuteurs, en déclin."},
    {"code": "kru", "name": "Kru", "native_name": "Kru", "flag": "🇱🇷", "family": "niger-congo", "region": "Liberia", "speakers": 30_000, "status": "critique", "offline_supported": False, "description": "Langue critiquement menacée — moins de 30 000 locuteurs."},
    {"code": "dgm", "name": "Dangme", "native_name": "Dangme", "flag": "🇬🇭", "family": "niger-congo", "region": "Ghana", "speakers": 20_000, "status": "critique", "offline_supported": False, "description": "Préservation urgente — population vieillissante."},
    {"code": "snk", "name": "Soninké", "native_name": "Sooninkanxannen", "flag": "🇲🇱", "family": "niger-congo", "region": "Mali, Sénégal", "speakers": 1_300_000, "status": "menacé", "offline_supported": True},

    # Mondiales — pour l'usage diaspora
    {"code": "fra", "name": "Français", "native_name": "Français", "flag": "🇫🇷", "family": "indo-european", "region": "Mondial", "speakers": 320_000_000, "status": "vivant", "offline_supported": True},
    {"code": "eng", "name": "Anglais", "native_name": "English", "flag": "🇬🇧", "family": "indo-european", "region": "Mondial", "speakers": 1_500_000_000, "status": "vivant", "offline_supported": True},
    {"code": "ara", "name": "Arabe", "native_name": "العربية", "flag": "🇸🇦", "family": "afro-asiatic", "region": "Afrique du Nord, Moyen-Orient", "speakers": 422_000_000, "status": "vivant", "offline_supported": True},
]


QUEST_SEED = [
    {
        "title": "Salutations au marché de Dakar",
        "description": "Apprenez à saluer comme un vrai Sénégalais à Dakar.",
        "language_code": "wol",
        "level": "beginner",
        "icon": "🛒",
        "xp_reward": 100,
        "duration_min": 8,
        "steps": [
            {"type": "vocab", "prompt": "Comment dit-on 'Bonjour' en Wolof ?", "answer": "Salaam aleekum", "options": ["Salaam aleekum", "Jërëjëf", "Naka nga def", "Waaw"]},
            {"type": "listening", "prompt": "Écoutez puis répétez : 'Naka nga def ?'", "answer": "Naka nga def", "audioUrl": ""},
            {"type": "speaking", "prompt": "Dites 'Merci' en Wolof", "answer": "Jërëjëf"},
            {"type": "scenario", "prompt": "Un vendeur vous dit 'Salaam aleekum'. Que répondez-vous ?", "answer": "Maa lekum salaam"},
        ],
    },
    {
        "title": "Négocier le prix d'une mangue",
        "description": "Marchander en Bambara au marché de Bamako.",
        "language_code": "bam",
        "level": "intermediate",
        "icon": "🥭",
        "xp_reward": 200,
        "duration_min": 15,
        "steps": [
            {"type": "vocab", "prompt": "Comment dit-on 'Combien ?' en Bambara ?", "answer": "Joli ?"},
            {"type": "scenario", "prompt": "La vendeuse dit '500 FCFA'. Comment dire 'C'est trop cher' ?", "answer": "A ka gɛlɛn"},
        ],
    },
    {
        "title": "L'histoire du village (Bissa)",
        "description": "Préservez une langue menacée — racontez l'histoire de votre village.",
        "language_code": "bis",
        "level": "beginner",
        "icon": "📖",
        "xp_reward": 300,
        "duration_min": 20,
        "steps": [
            {"type": "vocab", "prompt": "Comment dit-on 'Bonjour' en Bissa ?", "answer": "Awa"},
            {"type": "listening", "prompt": "Écoutez la grand-mère raconter l'origine du village.", "answer": ""},
        ],
    },
]


def seed_if_empty():
    """Ne lance le seed que si les tables sont vides."""
    if Language.query.count() == 0:
        for data in LANGUAGE_SEED:
            db.session.add(Language(**data))
        db.session.commit()
        print(f"[KIVU] {len(LANGUAGE_SEED)} langues seedées.")

    if Quest.query.count() == 0:
        for data in QUEST_SEED:
            steps = data.pop("steps", [])
            q = Quest(**data)
            q.steps = steps
            db.session.add(q)
        db.session.commit()
        print(f"[KIVU] {len(QUEST_SEED)} quêtes seedées.")
