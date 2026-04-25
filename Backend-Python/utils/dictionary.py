"""
Dictionnaire propriétaire KIVU — traduction hors-ligne pour 10+ langues africaines
+ détection heuristique de la langue.

Couvre : fra, eng, swa, wol, bam, dyu, lin, yor, hau, amh, zul, ibo, bis (Bissa endangered)
"""

import re
import unicodedata

# Phrases courantes — la "preuve de concept" mobile-first
COMMON_PHRASES = {
    "bonjour": {
        "fra": "Bonjour",
        "eng": "Hello",
        "swa": "Jambo",
        "wol": "Salaam aleekum",
        "bam": "I ni ce",
        "dyu": "I ni ce",
        "lin": "Mbote",
        "yor": "Bawo",
        "hau": "Sannu",
        "amh": "Selam",
        "zul": "Sawubona",
        "ibo": "Ndewo",
        "bis": "Awa",  # Bissa
    },
    "merci": {
        "fra": "Merci",
        "eng": "Thank you",
        "swa": "Asante",
        "wol": "Jërëjëf",
        "bam": "I ni ce",
        "dyu": "I ni ce",
        "lin": "Matondi",
        "yor": "E se",
        "hau": "Na gode",
        "amh": "Ameseginalehu",
        "zul": "Ngiyabonga",
        "ibo": "Daalu",
        "bis": "Barka",
    },
    "comment ça va": {
        "fra": "Comment ça va ?",
        "eng": "How are you?",
        "swa": "Habari yako?",
        "wol": "Naka nga def?",
        "bam": "I ka kéne?",
        "dyu": "I ka kéne?",
        "lin": "Ozali malamu?",
        "yor": "Bawo ni?",
        "hau": "Yaya kake?",
        "amh": "Endemen neh?",
        "zul": "Unjani?",
        "ibo": "Kedu?",
        "bis": "Yele?",
    },
    "au revoir": {
        "fra": "Au revoir",
        "eng": "Goodbye",
        "swa": "Kwaheri",
        "wol": "Ba beneen yoon",
        "bam": "K'an b'a fo",
        "dyu": "K'an bè ka",
        "lin": "Tokomonana",
        "yor": "O dabọ",
        "hau": "Sai an jima",
        "amh": "Dehna hun",
        "zul": "Sala kahle",
        "ibo": "Ka ọ dị",
        "bis": "Awa-yere",
    },
    "oui": {
        "fra": "Oui", "eng": "Yes", "swa": "Ndiyo", "wol": "Waaw",
        "bam": "Awɔ", "dyu": "Awɔ", "lin": "Eee", "yor": "Bẹẹni",
        "hau": "Ee", "amh": "Awo", "zul": "Yebo", "ibo": "Ee", "bis": "Hee",
    },
    "non": {
        "fra": "Non", "eng": "No", "swa": "Hapana", "wol": "Déedéet",
        "bam": "Ayi", "dyu": "Ayi", "lin": "Te", "yor": "Bẹẹkọ",
        "hau": "A'a", "amh": "Aydellem", "zul": "Cha", "ibo": "Mba", "bis": "Aa",
    },
    "eau": {
        "fra": "Eau", "eng": "Water", "swa": "Maji", "wol": "Ndox",
        "bam": "Ji", "dyu": "Ji", "lin": "Mai", "yor": "Omi",
        "hau": "Ruwa", "amh": "Wuha", "zul": "Amanzi", "ibo": "Mmiri", "bis": "Bia",
    },
    "famille": {
        "fra": "Famille", "eng": "Family", "swa": "Familia", "wol": "Njabootu",
        "bam": "Du", "dyu": "Du", "lin": "Libota", "yor": "Ẹbi",
        "hau": "Iyali", "amh": "Beteseb", "zul": "Umndeni", "ibo": "Ezinụlọ", "bis": "Bhao",
    },
}


def _strip_accents(text: str) -> str:
    """Replie les accents : 'ça' -> 'ca', 'éè' -> 'ee'."""
    return "".join(
        c for c in unicodedata.normalize("NFKD", text)
        if not unicodedata.combining(c)
    )


def _normalize(text: str) -> str:
    """Lower + strip + drop punctuation + fold accents."""
    return re.sub(r"[^\w\s]", "", _strip_accents(text).lower().strip())


def dictionary_translate(text: str, source: str, target: str) -> str:
    """
    Recherche dans le dictionnaire. Si phrase exacte trouvée, retourne la
    traduction ; sinon, traduit mot à mot. En dernier recours, encadre le texte.
    """
    if source == target:
        return text

    normalized = _normalize(text)

    # 1) Phrase exacte (clé FR ou variante normalisée dans la langue source)
    for phrase_key, translations in COMMON_PHRASES.items():
        if normalized == _normalize(phrase_key) or normalized == _normalize(translations.get(source, "")):
            return translations.get(target, text)

    # 2) Mot par mot
    words = normalized.split()
    translated_words = []
    for w in words:
        found = None
        for translations in COMMON_PHRASES.values():
            if w == _normalize(translations.get(source, "")):
                found = translations.get(target, w)
                break
        translated_words.append(found if found else w)

    if any(t != w for t, w in zip(translated_words, words)):
        return " ".join(translated_words).capitalize()

    # 3) Aucun match — placeholder éducatif
    return f"[{target.upper()}] {text}"


def detect_language_heuristic(text: str) -> str:
    """Détection rudimentaire par mots-clés."""
    if not text:
        return "fra"
    n = _normalize(text)
    keywords = {
        "fra": ["bonjour", "merci", "comment", "oui", "non", "famille"],
        "eng": ["hello", "thank", "how", "yes", "family"],
        "swa": ["jambo", "asante", "habari", "ndiyo"],
        "wol": ["salaam", "jerejef", "naka", "waaw"],
        "bam": ["ini", "awɔ", "ayi"],
        "yor": ["bawo", "ese", "beeni"],
        "hau": ["sannu", "gode", "yaya"],
        "amh": ["selam", "endemen"],
        "zul": ["sawubona", "ngiyabonga", "unjani"],
        "ibo": ["ndewo", "daalu", "kedu"],
        "bis": ["awa", "barka", "yele"],
    }
    scores = {lang: sum(1 for k in kws if k in n) for lang, kws in keywords.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "fra"
