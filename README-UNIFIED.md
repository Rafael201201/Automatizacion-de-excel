# 🚀 Excel Pro - Sistema Unificado

Sistema completo que integra un **conversor de archivos Excel ↔ Word** con un **bot inteligente de Excel** con capacidades de IA vía N8N.

## ✨ Características

### 📊 Conversor de Archivos
- ✅ Excel → Word (tablas formateadas)
- ✅ Word → Excel (extracción de tablas)
- ✅ Excel → CSV/JSON
- ✅ Compartir en múltiples plataformas
- ✅ Descarga local con selector de carpeta

### 🤖 Bot de Excel con IA
- ✅ Comandos en lenguaje natural
- ✅ Modificación de celdas
- ✅ Inserción de fórmulas
- ✅ Eliminación de filas
- ✅ Combinación de columnas
- ✅ Integración con N8N (IA opcional)
- ✅ Chat interactivo en la misma página

### 🎯 Todo en Un Solo Puerto
- ⚡ Frontend React
- 🤖 Bot integrado
- 🔄 Proxy a backend Python
- 📡 API REST completa

## 🏗️ Arquitectura

```
Puerto 3000 (Node.js + Express)
├── Frontend React (Conversor)
├── Bot de Excel (Chat UI)
├── API del Bot (/api/bot/*)
└── Proxy a Python (/api/python/* → :5000)

Puerto 5000 (Python Flask)
└── Procesamiento de archivos

Puerto 5678 (N8N - Opcional)
└── Workflows de IA
```

## 📋 Requisitos

- **Node.js** 16+
- **Python** 3.8+
- **npm** 8+
- **N8N** (opcional, para IA)

## ⚡ Instalación Rápida

### Windows
```bash
# Doble clic en:
start-unified.bat
```

### Mac/Linux
```bash
chmod +x start-unified.sh
./start-unified.sh
```

### Manual

```bash
# 1. Instalar dependencias
npm install
python -m venv venv
source venv/bin/activate  # o venv\Scripts\activate en Windows
pip install -r requirements.txt

# 2. Compilar frontend
npm run build

# 3. Crear carpetas
mkdir -p data/uploads
mkdir -p public/uploads/python/temp_uploads
mkdir -p public/uploads/python/temp_outputs

# 4. Iniciar (2 terminales)
# Terminal 1:
python processor_enhanced.py

# Terminal 2:
npm start
```

## 🌐 Acceso

- **Aplicación completa**: http://localhost:3000
- **Backend Python**: http://localhost:5000
- **N8N** (si activo): http://localhost:5678

## 🎮 Cómo Usar

### Modo 1: Conversor Tradicional

1. Sube archivo Excel o Word
2. Selecciona tipo de conversión
3. Procesa
4. Descarga o comparte

### Modo 2: Bot de Excel

1. Haz clic en el botón flotante 🤖
2. Sube un archivo Excel (.xlsx)
3. Chatea con el bot:
   ```
   pon 1500 en Hoja1 A2
   pon la fórmula =SUM(A1:A10) en Hoja1 C2
   calcula IVA*1.19 en Hoja1 D2
   elimina la fila 5 en Hoja1
   combina columna A con columna B en Hoja1 y ponlo en C
   lista hojas
   ```
4. Descarga el archivo modificado

## 🔧 Configuración

### Variables de Entorno

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Opciones importantes:

```bash
# Puerto del servidor
PORT=3000

# Habilitar N8N (IA)
N8N_ENABLED=false
N8N_WEBHOOK_URL=http://localhost:5678/webhook/excel-bot

# Entorno
NODE_ENV=development
```

### Habilitar N8N (IA)

1. Instala N8N:
   ```bash
   npx n8n
   ```

2. Configura en `.env`:
   ```bash
   N8N_ENABLED=true
   ```

3. Crea workflow en N8N (ver `N8N-INTEGRATION-GUIDE.md`)

## 📡 API Endpoints

### Bot de Excel
- `POST /api/bot/chat` - Enviar mensaje
- `POST /api/bot/upload` - Subir Excel
- `GET /api/bot/status` - Estado del archivo
- `GET /api/bot/health` - Health check
- `GET /download/active.xlsx` - Descargar resultado

### Conversor (Proxy a Python)
- `POST /api/python/upload` - Subir archivo
- `POST /api/python/process` - Procesar conversión
- `GET /api/python/download/:filename` - Descargar
- `GET /api/python/health` - Health check

## 🛠️ Tecnologías

### Backend
- **Node.js** + Express (servidor unificado)
- **Python** + Flask (procesamiento)
- **XLSX** (manipulación de Excel)
- **Multer** (uploads)
- **http-proxy-middleware** (proxy)

### Frontend
- **React** 18
- **Vite** (build tool)
- **Lucide React** (iconos)
- **CSS3** (estilos responsive)

### Integración
- **N8N** (workflows de IA - opcional)
- **Axios** (HTTP requests)

## 📚 Documentación

- [QUICKSTART-UNIFIED.md](QUICKSTART-UNIFIED.md) - Guía rápida
- [N8N-INTEGRATION-GUIDE.md](N8N-INTEGRATION-GUIDE.md) - Integración con N8N
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Solución de problemas
- [CHANGELOG.md](CHANGELOG.md) - Historial de cambios

## 🧪 Testing

```bash
# Health checks
curl http://localhost:3000/api/bot/health
curl http://localhost:5000/api/health

# Test bot
curl -X POST http://localhost:3000/api/bot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "lista hojas"}'
```

## 🐛 Troubleshooting

### Error: "Backend Python no disponible"
```bash
# Asegúrate de que Python esté corriendo
python processor_enhanced.py
```

### Error: "Puerto 3000 ocupado"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Bot no responde
1. Verifica que subiste un archivo Excel
2. Desactiva N8N si no lo estás usando
3. Revisa logs en consola del navegador

## 🚀 Despliegue en Producción

```bash
# 1. Compilar
npm run build

# 2. Variables de entorno
export NODE_ENV=production
export PORT=80

# 3. PM2 (recomendado)
npm install -g pm2
pm2 start server.js --name excel-pro
pm2 startup
pm2 save
```

## 📊 Estructura del Proyecto

```
excel-pro/
├── server.js                 # Servidor Node.js unificado
├── processor_enhanced.py     # Backend Python Flask
├── package.json              # Dependencias Node.js
├── requirements.txt          # Dependencias Python
├── .env.example              # Configuración de ejemplo
├── src/
│   ├── App.jsx               # App principal React
│   ├── ChatBot.jsx           # Componente del bot
│   ├── App.css               # Estilos principales
│   └── ChatBot.css           # Estilos del bot
├── public/
│   └── uploads/python/       # Archivos temporales
├── data/
│   ├── uploads/              # Uploads del bot
│   └── active.xlsx           # Excel activo del bot
├── dist/                     # Build de producción
└── docs/
    ├── QUICKSTART-UNIFIED.md
    ├── N8N-INTEGRATION-GUIDE.md
    └── TROUBLESHOOTING.md
```

## 🤝 Contribuciones

Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📄 Licencia

MIT License - Usa libremente para proyectos personales y comerciales.

## 👨‍💻 Autor

Desarrollado con ❤️ para facilitar el trabajo con Excel

## 🎯 Roadmap

- [ ] Soporte para Google Sheets
- [ ] Comandos de voz
- [ ] Historial de conversaciones
- [ ] Múltiples archivos simultáneos
- [ ] API REST documentada con Swagger
- [ ] Dashboard de analytics
- [ ] Temas oscuro/claro
- [ ] Versión móvil nativa

## ⭐ Agradecimientos

- Pandas - Procesamiento de datos
- OpenPyXL - Excel
- python-docx - Word
- N8N - Automatización
- React - UI

---

**¿Preguntas?** Abre un issue en GitHub o consulta la documentación.

**¡Gracias por usar Excel Pro!** 🎉
