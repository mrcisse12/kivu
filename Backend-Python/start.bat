@echo off
REM ────────────────────────────────────────────────────────────
REM KIVU Backend — script de démarrage Windows
REM ────────────────────────────────────────────────────────────
REM Usage : double-clique sur start.bat OU execute dans un terminal
REM ────────────────────────────────────────────────────────────

setlocal

echo.
echo ============================================
echo   KIVU Backend - Lancement
echo ============================================
echo.

REM 1. Vérifier que Python est installé
where python >nul 2>nul
if errorlevel 1 (
    echo [X] Python n'est pas installé ou pas dans le PATH.
    echo Telecharge-le sur https://www.python.org/downloads/
    pause
    exit /b 1
)

REM 2. Créer le venv s'il n'existe pas
if not exist ".venv\" (
    echo [+] Creation de l'environnement virtuel...
    python -m venv .venv
)

REM 3. Activer le venv
call .venv\Scripts\activate.bat

REM 4. Installer les dépendances
echo [+] Installation des dependances...
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

REM 5. Vérifier .env
if not exist ".env" (
    echo.
    echo [!] Fichier .env manquant - copie de .env.example
    copy .env.example .env >nul
    echo.
    echo IMPORTANT: edite Backend-Python\.env et ajoute :
    echo   ANTHROPIC_API_KEY=ta-cle-ici  (recommande)
    echo   ou
    echo   OPENAI_API_KEY=ta-cle-ici
    echo.
    echo Sans cle API, Kivi utilise sa base offline (100+ sujets).
    echo.
    pause
)

REM 6. Démarrer le serveur
echo.
echo ============================================
echo   Backend pret sur http://localhost:5000
echo   Endpoints:
echo     GET  /api/v1/health
echo     POST /api/v1/assistant/chat
echo     POST /api/v1/assistant/chat/stream
echo ============================================
echo.

python app.py
