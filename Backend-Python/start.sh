#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# KIVU Backend — script de démarrage Linux/Mac
# ─────────────────────────────────────────────────────────────
# Usage : ./start.sh
# ─────────────────────────────────────────────────────────────

set -e

echo ""
echo "============================================"
echo "  KIVU Backend - Lancement"
echo "============================================"
echo ""

# 1. Vérifier Python
if ! command -v python3 &> /dev/null; then
  echo "[X] python3 n'est pas installé."
  echo "    Sur Mac : brew install python"
  echo "    Sur Linux : sudo apt install python3 python3-venv python3-pip"
  exit 1
fi

# 2. Créer le venv s'il n'existe pas
if [ ! -d ".venv" ]; then
  echo "[+] Création de l'environnement virtuel..."
  python3 -m venv .venv
fi

# 3. Activer le venv
source .venv/bin/activate

# 4. Installer les dépendances
echo "[+] Installation des dépendances..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

# 5. Vérifier .env
if [ ! -f ".env" ]; then
  echo ""
  echo "[!] Fichier .env manquant — copie de .env.example"
  cp .env.example .env
  echo ""
  echo "IMPORTANT : édite Backend-Python/.env et ajoute :"
  echo "  ANTHROPIC_API_KEY=ta-clé-ici  (recommandé)"
  echo "  ou"
  echo "  OPENAI_API_KEY=ta-clé-ici"
  echo ""
  echo "Sans clé API, Kivi utilise sa base offline (100+ sujets)."
  echo ""
  read -p "Appuie sur Entrée pour continuer..." -r
fi

# 6. Démarrer le serveur
echo ""
echo "============================================"
echo "  Backend prêt sur http://localhost:5000"
echo "  Endpoints :"
echo "    GET  /api/v1/health"
echo "    POST /api/v1/assistant/chat"
echo "    POST /api/v1/assistant/chat/stream"
echo "============================================"
echo ""

python3 app.py
