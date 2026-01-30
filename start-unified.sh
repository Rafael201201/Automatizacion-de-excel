#!/bin/bash

clear
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║  🚀 EXCEL PRO - SISTEMA UNIFICADO                          ║
║  Conversor de Archivos + Bot con IA                        ║
╚════════════════════════════════════════════════════════════╝
EOF
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ ERROR: Python no está instalado${NC}"
    echo "📥 Instálalo desde: https://python.org"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ ERROR: Node.js no está instalado${NC}"
    echo "📥 Instálalo desde: https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✅ Python y Node.js detectados${NC}"
echo ""

# Instalar dependencias Node.js si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias de Node.js..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error instalando dependencias${NC}"
        exit 1
    fi
fi

# Crear entorno virtual Python si no existe
if [ ! -d "venv" ]; then
    echo "🐍 Creando entorno virtual de Python..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📦 Instalando dependencias de Python..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error instalando dependencias Python${NC}"
        exit 1
    fi
else
    source venv/bin/activate
fi

# Compilar frontend si no existe dist
if [ ! -d "dist" ]; then
    echo "🏗️ Compilando frontend React..."
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error compilando frontend${NC}"
        exit 1
    fi
fi

# Crear carpetas necesarias
mkdir -p data/uploads
mkdir -p public/uploads/python/temp_uploads
mkdir -p public/uploads/python/temp_outputs

echo ""
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║  🚀 INICIANDO SERVIDORES                                   ║
╚════════════════════════════════════════════════════════════╝
EOF
echo ""

# Función para manejar Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    kill $PYTHON_PID 2>/dev/null
    kill $NODE_PID 2>/dev/null
    echo "✅ Servidores detenidos"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar Backend Python
echo "[1/2] Iniciando Backend Python (puerto 5000)..."
python3 processor_enhanced.py > logs/python.log 2>&1 &
PYTHON_PID=$!
sleep 2

# Verificar que Python se inició correctamente
if ! ps -p $PYTHON_PID > /dev/null; then
    echo -e "${RED}❌ Error: Backend Python no se inició${NC}"
    echo "Ver logs en: logs/python.log"
    exit 1
fi

# Iniciar Frontend + Bot
echo "[2/2] Iniciando Frontend + Bot (puerto 3000)..."
npm start > logs/node.log 2>&1 &
NODE_PID=$!
sleep 2

# Verificar que Node se inició correctamente
if ! ps -p $NODE_PID > /dev/null; then
    echo -e "${RED}❌ Error: Frontend no se inició${NC}"
    echo "Ver logs en: logs/node.log"
    kill $PYTHON_PID 2>/dev/null
    exit 1
fi

echo ""
cat << "EOF"
╔════════════════════════════════════════════════════════════╗
║  ✅ SISTEMA INICIADO CORRECTAMENTE                         ║
╠════════════════════════════════════════════════════════════╣
║  🌐 Aplicación: http://localhost:3000                      ║
║  🤖 Bot incluido en la misma página                        ║
║  🐍 Backend Python: http://localhost:5000                  ║
╠════════════════════════════════════════════════════════════╣
║  💡 CÓMO USAR:                                             ║
║  1. Abre http://localhost:3000 en tu navegador             ║
║  2. Usa el conversor tradicional (centro)                  ║
║  3. Haz clic en el bot 🤖 (abajo derecha)                  ║
║  4. Sube un Excel y chatea con el bot                      ║
╠════════════════════════════════════════════════════════════╣
║  🔧 OPCIONAL - N8N para IA:                                ║
║  • En otra terminal: npx n8n                               ║
║  • URL: http://localhost:5678                              ║
╠════════════════════════════════════════════════════════════╣
║  📊 LOGS:                                                  ║
║  • Python: logs/python.log                                 ║
║  • Node.js: logs/node.log                                  ║
╠════════════════════════════════════════════════════════════╣
║  🛑 DETENER: Presiona Ctrl+C                               ║
╚════════════════════════════════════════════════════════════╝
EOF
echo ""

# Abrir navegador automáticamente (opcional)
if command -v xdg-open &> /dev/null; then
    sleep 3
    xdg-open http://localhost:3000 &
elif command -v open &> /dev/null; then
    sleep 3
    open http://localhost:3000 &
fi

# Mostrar logs en vivo (opcional)
echo -e "${YELLOW}💡 Tip: Presiona Ctrl+C para detener todos los servidores${NC}"
echo ""

# Esperar indefinidamente
wait
