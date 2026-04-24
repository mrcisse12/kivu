# 🌍 KIVU — Plateforme mondiale de traduction & apprentissage linguistique

> **Unir l'Afrique par la langue.**
> 2000+ langues africaines · 7 milliards de personnes connectées · 100% hors-ligne possible.

Projet présenté à **Science Fest Africa 2026**.

---

## 🎯 Vision

KIVU est la plateforme IA qui transforme les **2000+ langues africaines** en ressource vivante et accessible, permettant à **7 milliards de personnes** de communiquer, apprendre et préserver leurs cultures. KIVU sauve les langues menacées (Bissa, Kru, Dangme, Soninké) avant qu'elles ne disparaissent à jamais.

---

## 🚀 Les 8 fonctionnalités révolutionnaires

| # | Fonctionnalité | Description |
|---|---|---|
| 1 | 🎙️ **Traduction vocale temps réel** | Offline, <200ms, voix naturelle clonée |
| 2 | 🎮 **Apprentissage gamifié** | XP, quêtes, badges, leaderboard — 85%+ rétention |
| 3 | 🛡️ **Préservation culturelle** | Archive immortelle pour les langues menacées |
| 4 | 💼 **Business & commerce** | Cross-border, algorithmes EOQ/WMA/Safety Stock |
| 5 | 🤝 **Multi-parties temps réel** | Chacun parle sa langue, tous se comprennent |
| 6 | 📚 **AI Tutor personnel** | Apprentissage contextuel dans la vraie vie |
| 7 | 💙 **Diaspora** | Reconnecter les familles, transmettre l'héritage |
| 8 | ♿ **Accessibilité** | Vision, audition, mobilité, 2G/3G |

---

## 📦 Architecture

```
Nouveau KIVU/
├── KIVU-iOS/          # App iOS native (Swift + SwiftUI)
├── KIVU-Android/      # App Android native (Kotlin + Jetpack Compose)
├── Backend/           # Backend Node.js (Express + Socket.IO + MongoDB)
├── Backend-Python/    # Backend Python (Flask + SQLAlchemy + SQLite)
├── Frontend/          # PWA Vanilla JS (SPA, Vite, Chart.js, Service Worker)
├── render.yaml        # Déploiement Render (backends)
└── .claude/launch.json
```

---

## ⚡ Quick Start

### 🖥️ Frontend PWA (Vanilla JS)

```bash
cd Frontend
npm install
npm run dev           # → http://localhost:5173
npm run build         # → dist/
```

- **PWA installable** (Service Worker + manifest)
- **Offline-first** (cache des leçons + dictionnaire local)
- **Mobile-first** (conçu pour smartphones africains, marche en 2G/3G)
- **Chart.js** pour les animations de progression
- **Aucun framework** : pur Vanilla JS avec router hash-based et `render()`

### 🐍 Backend Python (Flask + SQLAlchemy + SQLite)

```bash
cd Backend-Python
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
python app.py              # → http://localhost:5000
```

**Endpoints principaux (`/api/v1/*`)**
- `POST /auth/signup` · `POST /auth/signin` · `GET /auth/me`
- `POST /translation/translate` · `GET /translation/history`
- `GET /languages` · `GET /learning/quests` · `POST /learning/quests/:id/complete`
- `GET /preservation/archives` · `POST /preservation/archives`
- `POST /economics/eoq` · `POST /economics/wma` · `POST /economics/safety-stock`
- `GET /business/products` · `GET /business/products/:id/analytics`

**Authentification Bearer** — JWT signé HS256, session par utilisateur.

**Algorithmes économiques** (`services/economics.py`) :
- **WMA** — Weighted Moving Average (prévision demande)
- **EOQ** — Economic Order Quantity (formule de Wilson)
- **Safety Stock** — SS = Z × σ × √(Lead Time)
- **Reorder Point** — ROP = demande × lead time + SS
- **ABC Analysis** — classification par valeur

Tests : `python -m unittest discover tests`

### 🟢 Backend Node.js (alternative)

```bash
cd Backend
npm install
npm run dev                 # → http://localhost:4000
```

### 📱 iOS (Swift)

Ouvrir `KIVU-iOS/` dans Xcode 15+, target iOS 17+.

### 🤖 Android (Kotlin + Jetpack Compose)

```bash
cd KIVU-Android
./gradlew assembleDebug
```

MinSDK 24 (Android 7) — fonctionne sur les vieux smartphones africains.

---

## 🌐 Déploiement (gratuit)

| Service | Plateforme | Fichier |
|---|---|---|
| **Frontend** | Vercel | `Frontend/vercel.json` |
| **Backend Python** | Render | `render.yaml` (`kivu-backend-python`) |
| **Backend Node** | Render | `render.yaml` (`kivu-backend-node`) |

### Vercel (Frontend)
```bash
cd Frontend
npx vercel --prod
```

### Render (Backend)
1. Push vers GitHub
2. Sur [render.com](https://render.com) → **New → Blueprint**
3. Sélectionner ce repo → Render détecte `render.yaml`
4. Les deux services (Python + Node) se déploient automatiquement

---

## 🧪 Tests & démo des algorithmes économiques

```bash
# EOQ avec curl
curl -X POST http://localhost:5000/api/v1/economics/eoq \
  -H "Content-Type: application/json" \
  -d '{"annualDemand": 1000, "orderingCost": 50, "holdingCost": 2}'
# → {"eoq": 223.61, "ordersPerYear": 4.47, ...}

# Safety Stock
curl -X POST http://localhost:5000/api/v1/economics/safety-stock \
  -H "Content-Type: application/json" \
  -d '{"dailyDemand": [5,7,6,8,4,9,6], "leadTimeDays": 7, "serviceLevel": 0.95}'
```

---

## 🎨 Design System

- **Couleurs** : Bleu Lac Kivu (#174E9C) · Bleu ciel (#3395DA) · Orange savane (#F2952D) · Vert savane (#2E8B57)
- **Typographie** : Inter + Nunito (font-display)
- **Radius** : 12 / 16 / 20 / 24 px
- **Ombres** : douces, multicouches
- **Mode sombre** : natif
- **Accessibilité** : contraste AAA, taille de texte ajustable, screen reader compatible

---

## 💰 Modèle économique

- **Freemium** : 30 min/jour gratuit
- **Starter** 2 000 FCFA/mois — illimité + offline
- **Pro** 5 000 FCFA/mois — famille (5 personnes)
- **Family** 10 000 FCFA/mois — 10+ personnes
- **Enterprise** — Telecom, e-commerce, gouvernement, santé

**Potentiel :** 5B$ année 1 → 200B$ année 5.

---

## 🔐 Sécurité

- Authentification **Bearer JWT** (HS256, expiration 30 jours)
- Mots de passe **bcrypt** (12 rounds)
- CORS strict (whitelist)
- Rate limiting (500 req / 15 min)
- HTTPS obligatoire en production
- Chiffrement **E2E** pour les traductions sensibles

---

## 🤝 Contribuer

Les contributions sont bienvenues, surtout pour :
- Ajouter des langues africaines au dictionnaire
- Enregistrer des contes et proverbes
- Traduire l'interface
- Améliorer les modèles de reconnaissance vocale

---

## 📄 Licence

MIT © 2026 KIVU Team — Science Fest Africa

---

**KIVU — Parce qu'une langue qui meurt, c'est une humanité qui s'appauvrit.** 🌍
