# KIVU Backend — Guide de lancement

Backend Flask pour l'app KIVU. Fournit l'API REST, l'IA assistant Kivi, la traduction, l'authentification et la synthèse vocale premium.

---

## 🚀 Démarrage rapide (Windows)

```bat
cd Backend-Python
start.bat
```

Le script :
1. Crée l'environnement virtuel Python (.venv)
2. Installe les dépendances
3. Copie `.env.example` → `.env` si nécessaire
4. Lance le serveur sur `http://localhost:5000`

## 🚀 Démarrage rapide (Mac / Linux)

```bash
cd Backend-Python
chmod +x start.sh
./start.sh
```

---

## 🔑 Activer l'IA puissante (Kivi rivalise ChatGPT)

Édite `Backend-Python/.env` et ajoute **une** des clés suivantes :

### Option 1 — Anthropic (RECOMMANDÉ pour KIVU)

Claude Sonnet 4.5 — la meilleure IA pour les langues africaines.

1. Va sur **https://console.anthropic.com/settings/keys**
2. Crée un compte (ils offrent **5$ de crédit gratuit**)
3. Clique "Create Key"
4. Copie la clé (commence par `sk-ant-api03-...`)
5. Dans `.env` :
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXX
   ```

### Option 2 — OpenAI

GPT-4o — très bon aussi, voix TTS premium incluses.

1. Va sur **https://platform.openai.com/api-keys**
2. Crée un compte (5$ minimum à recharger)
3. Crée une clé secrète
4. Copie la clé (commence par `sk-proj-...`)
5. Dans `.env` :
   ```env
   OPENAI_API_KEY=sk-proj-XXXXXXXXXXXX
   ```

### Si les deux sont définies
KIVU utilise **Anthropic** en priorité (meilleur multilingue).

### Sans clé
Le frontend bascule automatiquement sur sa **knowledge base offline** : 100+ sujets africains et généraux. L'app fonctionne quand même, mais sans la puissance générative complète.

---

## 🎙️ Activer les voix premium IA (optionnel)

### ElevenLabs (multilingue, accents africains)

1. Va sur **https://elevenlabs.io/**
2. Crée un compte (10 000 caractères/mois gratuit)
3. Profile → API Keys → copie la clé
4. Dans `.env` :
   ```env
   ELEVENLABS_API_KEY=XXXXXXXXXXXX
   ```

### Voix custom par langue
Pour des accents authentiques (cloned voices), récupère les voice IDs depuis **https://elevenlabs.io/app/voice-library** :

```env
ELEVENLABS_VOICE_SWA=<id-voix-swahili-cloned>
ELEVENLABS_VOICE_WOL=<id-voix-wolof-cloned>
ELEVENLABS_VOICE_HAU=<id-voix-haoussa-cloned>
```

---

## 🧪 Vérifier que ça marche

Une fois le serveur lancé :

```bash
# Health check
curl http://localhost:5000/api/v1/health

# Test l'assistant
curl -X POST http://localhost:5000/api/v1/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Bonjour Kivi"}]}'

# Test le statut des voix premium
curl http://localhost:5000/api/v1/voice/status
```

Côté frontend, va sur `/assistant` et envoie un message. Tu verras dans la bulle "✨ Claude Sonnet 4.5" ou "🤖 GPT-4o" si la clé est active. Sinon "📴 Mode hors-ligne".

---

## 🔧 Endpoints principaux

| Méthode | URL | Description |
|---|---|---|
| `GET`  | `/api/v1/health` | Health check |
| `POST` | `/api/v1/assistant/chat` | Chat IA non-streaming (JSON) |
| `POST` | `/api/v1/assistant/chat/stream` | Chat IA en streaming (SSE) |
| `GET`  | `/api/v1/assistant/suggestions` | 10 prompts d'exemple |
| `POST` | `/api/v1/translation/translate` | Traduction texte |
| `POST` | `/api/v1/voice/synthesize` | TTS premium (ElevenLabs/OpenAI) |
| `GET`  | `/api/v1/voice/status` | État des voix premium |
| `POST` | `/api/v1/auth/signin` | Connexion |
| `POST` | `/api/v1/auth/signup` | Inscription |

---

## 📦 Dépendances Python

Voir `requirements.txt` :
- Flask 3.x + Flask-Cors + Flask-SQLAlchemy
- PyJWT (auth)
- bcrypt (mots de passe)
- requests (ElevenLabs HTTP)
- openai >= 1.30 (gpt-4o + TTS + streaming)
- anthropic >= 0.40 (Claude Sonnet 4.5 + streaming)
- python-dotenv (.env auto-load)

---

## 🐛 Problèmes courants

### "Module not found"
Active le venv : `.venv\Scripts\activate` (Windows) ou `source .venv/bin/activate` (Mac/Linux), puis `pip install -r requirements.txt`.

### "Address already in use"
Un autre processus utilise le port 5000. Change dans `.env` :
```env
PORT=5001
```
Et update le frontend `.env.local` :
```env
VITE_API_URL=http://localhost:5001/api/v1
```

### "CORS error" depuis le frontend
Vérifie que `CORS_ORIGINS` dans `.env` contient l'URL du frontend (par défaut `http://localhost:5173`).

### L'assistant répond "Mode hors-ligne" alors que j'ai mis ma clé
1. Vérifie que `.env` est bien à `Backend-Python/.env` (pas dans le dossier parent)
2. Redémarre le serveur (Ctrl+C puis relance)
3. Vérifie que la clé est bien chargée : `python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.environ.get('ANTHROPIC_API_KEY', 'NOT SET')[:10])"`

---

## 🌍 Déploiement production

KIVU est déjà configuré pour **Render.com** :
- `Procfile` : `web: gunicorn app:app`
- `runtime.txt` : Python version
- DB : auto-provisioning Postgres si `DATABASE_URL` est définie

Sur Render, configure les variables d'environnement dans le dashboard (équivalent de `.env`).

Le frontend Vercel peut pointer vers le backend via :
```env
VITE_API_URL=https://kivu-backend.onrender.com/api/v1
```
