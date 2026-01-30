@echo off
cls
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  🚀 CONVERSOR DE ARCHIVOS + BOT - INICIO UNIFICADO            ║
echo ╠════════════════════════════════════════════════════════════════╣
echo ║  TODO EN UN SOLO PUERTO (3000)                                 ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    echo 📥 Descárgalo de: https://nodejs.org
    pause
    exit /b 1
)

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no está instalado
    echo 📥 Descárgalo de: https://python.org
    pause
    exit /b 1
)

echo ✅ Node.js y Python detectados
echo.

REM Instalar dependencias si es la primera vez
if not exist "node_modules\" (
    echo 📦 Instalando dependencias de Node.js...
    call npm install
    if errorlevel 1 (
        echo ❌ Error instalando dependencias Node.js
        pause
        exit /b 1
    )
)

REM Verificar venv de Python
if not exist "venv\" (
    echo 🐍 Creando entorno virtual Python...
    python -m venv venv
)

call venv\Scripts\activate.bat
echo 📦 Instalando dependencias de Python...
pip install -q -r requirements.txt

echo.

REM Compilar React si no existe dist
if not exist "dist\" (
    echo ⚛️  Compilando React...
    call npm run build
    if errorlevel 1 (
        echo ❌ Error compilando React
        pause
        exit /b 1
    )
)

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  🌟 INICIANDO SERVIDOR UNIFICADO...                            ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 🔄 Python Flask se iniciará automáticamente
echo 📊 Todo funcionará en: http://localhost:3000
echo.
echo 💡 Presiona Ctrl+C para detener el servidor
echo.

REM Iniciar servidor unificado
node server.js

pause