# 🚀 Excel Pro - Sistema Completo Unificado

Sistema integral que combina un **conversor de archivos Excel ↔ Word** con un **bot inteligente de Excel** con capacidades de IA vía N8N. Todo funcionando en un solo puerto.

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![Python](https://img.shields.io/badge/python-%3E%3D3.8-brightgreen)

## 🌟 Características Principales

### 📊 Conversor de Archivos
- ✅ **Excel → Word** - Tablas formateadas profesionalmente
- ✅ **Word → Excel** - Extracción automática de tablas
- ✅ **Excel → CSV/JSON** - Exportación de datos
- ✅ **Compartir** - WhatsApp, Telegram, Email, Redes Sociales
- ✅ **Descarga Local** - Selector de carpeta del sistema

### 🤖 Bot de Excel con IA
- ✅ **Lenguaje Natural** - Comandos en español
- ✅ **Modificación de Celdas** - Valores y fórmulas
- ✅ **Manipulación de Datos** - Eliminar filas, combinar columnas
- ✅ **Chat Interactivo** - Panel deslizable integrado
- ✅ **Integración N8N** - IA opcional (ChatGPT, Claude, etc.)
- ✅ **Persistencia** - Archivo activo entre sesiones

### 🎯 Arquitectura Unificada
- ⚡ **Un Solo Puerto** - Todo en `localhost:3000`
- 🔄 **Proxy Transparente** - Frontend ↔ Backend sin CORS
- 🎨 **UI Moderna** - React con diseño responsive
- 📡 **API REST** - Endpoints bien documentados

## 📋 Requisitos del Sistema

- **Node.js** 16.0.0 o superior
- **Python** 3.8 o superior
- **npm** 8.0.0 o superior
- **N8N** (opcional, para funciones de IA)

## ⚡ Instalación Rápida

### Opción 1: Scripts Automáticos

**Windows:**
```bash
start-unified.bat
```

**Mac/Linux:**
```bash
chmod +x start-unified.sh
./start-unified.sh
```

### Opción 2: Instalación Manual

```bash
# 1. Instalar dependencias de Node.js
npm install

# 2. Crear y activar entorno virtual Python
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# 3. Instalar dependencias Python
pip install -r requirements.txt

# 4. Compilar frontend React
npm run build

# 5. Crear estructura de carpetas
mkdir -p data/uploads
mkdir -p public/uploads/python/temp_uploads
mkdir -p public/uploads/python/temp_outputs
```

## 🚀 Ejecución

### Iniciar el Sistema (2 terminales)

**Terminal 1 - Backend Python:**
```bash
# Activar entorno virtual
source venv/bin/activate  # Mac/Linux
# o
venv\Scripts\activate     # Windows

# Iniciar servidor Python
python processor_enhanced.py
```

**Terminal 2 - Frontend + Bot:**
```bash
npm start
```

### Acceso
- 🌐 **Aplicación completa**: http://localhost:3000
- 🤖 **Bot integrado**: Mismo puerto (botón flotante)
- 🐍 **Backend Python**: http://localhost:5000 (interno)
- 🔧 **N8N** (opcional): http://localhost:5678

## 🎮 Guía de Uso

### Modo 1: Conversor Tradicional

1. Abre http://localhost:3000
2. Arrastra o selecciona un archivo Excel/Word
3. Elige el tipo de conversión:
   - Excel → Word
   - Word → Excel
   - Excel → CSV
   - Excel → JSON
4. Haz clic en "Procesar Archivo"
5. Descarga o comparte el resultado

### Modo 2: Bot de Excel

1. Haz clic en el botón flotante 🤖 (esquina inferior derecha)
2. Sube un archivo Excel (.xlsx)
3. Escribe comandos en lenguaje natural:

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

Variables importantes:

```bash
# Puerto del servidor Node.js
PORT=3000

# Habilitar N8N (IA)
N8N_ENABLED=false
N8N_WEBHOOK_URL=http://localhost:5678/webhook/excel-bot

# Entorno de ejecución
NODE_ENV=development
```

### Habilitar IA con N8N

1. **Instalar N8N:**
   ```bash
   npx n8n
   ```

2. **Configurar `.env`:**
   ```bash
   N8N_ENABLED=true
   N8N_WEBHOOK_URL=http://localhost:5678/webhook/excel-bot
   ```

3. **Crear Workflow en N8N:**
   - Ve a http://localhost:5678
   - Importa el workflow de ejemplo (ver `N8N-INTEGRATION-GUIDE.md`)
   - Conecta con ChatGPT, Claude u otro servicio de IA

4. **Reiniciar el servidor:**
   ```bash
   npm start
   ```

Ver guía completa: [N8N-INTEGRATION-GUIDE.md](N8N-INTEGRATION-GUIDE.md)

## 📡 API Endpoints

### Bot de Excel
```
POST   /api/bot/chat              # Enviar mensaje al bot
POST   /api/bot/upload            # Subir archivo Excel
GET    /api/bot/status            # Estado del archivo activo
GET    /api/bot/health            # Health check
POST   /api/bot/config/n8n        # Configurar N8N
GET    /download/active.xlsx      # Descargar resultado
```

### Conversor (Proxy a Python)
```
POST   /api/python/upload         # Subir archivo para conversión
POST   /api/python/process        # Procesar conversión
GET    /api/python/download/:file # Descargar archivo procesado
GET    /api/python/health         # Health check Python
```

### N8N Webhook (Opcional)
```
POST   /webhook/excel-bot         # Recibir comandos del bot
```

## 🛠️ Tecnologías

### Backend
- **Node.js + Express** - Servidor unificado
- **Python + Flask** - Procesamiento de archivos
- **Pandas** - Manipulación de datos
- **OpenPyXL** - Manejo de Excel
- **python-docx** - Manejo de Word
- **XLSX.js** - Procesamiento Excel en Node

### Frontend
- **React 18** - UI interactiva
- **Vite** - Build tool ultrarrápido
- **Lucide React** - Iconos modernos
- **CSS3** - Estilos responsive

### Integración
- **N8N** - Workflows de automatización e IA
- **http-proxy-middleware** - Proxy transparente
- **Axios** - Cliente HTTP

## 📚 Documentación Completa

- 📖 [QUICKSTART-UNIFIED.md](QUICKSTART-UNIFIED.md) - Guía rápida de inicio
- 🔗 [N8N-INTEGRATION-GUIDE.md](N8N-INTEGRATION-GUIDE.md) - Integración con N8N
- 🐛 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Solución de problemas
- 📝 [CHANGELOG.md](CHANGELOG.md) - Historial de cambios

## 🧪 Testing

### Health Checks

```bash
# Servidor Node.js + Bot
curl http://localhost:3000/api/bot/health

# Backend Python
curl http://localhost:5000/api/health

# N8N (si está activo)
curl http://localhost:5678
```

### Test del Bot

```bash
# Estado del archivo activo
curl http://localhost:3000/api/bot/status

# Enviar comando (necesita archivo activo primero)
curl -X POST http://localhost:3000/api/bot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "lista hojas"}'
```

## 📊 Estructura del Proyecto

```
excel-pro/
├── src/                          # Código fuente React
│   ├── App.jsx                   # Componente principal
│   ├── ChatBot.jsx               # Componente del bot
│   ├── App.css                   # Estilos principales
│   ├── ChatBot.css               # Estilos del bot
│   └── main.jsx                  # Punto de entrada
│
├── public/                       # Archivos estáticos
│   └── uploads/python/           # Archivos temporales
│       ├── temp_uploads/         # Uploads del conversor
│       └── temp_outputs/         # Outputs del conversor
│
├── data/                         # Datos del bot
│   ├── uploads/                  # Uploads del bot
│   └── active.xlsx               # Excel activo
│
├── server.js                     # Servidor Node.js unificado
├── processor_enhanced.py         # Backend Python Flask
├── package.json                  # Dependencias Node.js
├── requirements.txt              # Dependencias Python
├── vite.config.js                # Configuración Vite
├── .env.example                  # Ejemplo de variables de entorno
├── .gitignore                    # Archivos ignorados por Git
│
├── start-unified.bat             # Script de inicio Windows
├── start-unified.sh              # Script de inicio Mac/Linux
│
└── docs/                         # Documentación
    ├── README.md                 # Este archivo
    ├── QUICKSTART-UNIFIED.md     # Guía rápida
    ├── N8N-INTEGRATION-GUIDE.md  # Guía de N8N
    └── TROUBLESHOOTING.md        # Problemas comunes
```

## 🐛 Solución de Problemas

### "Backend Python no disponible"

**Causa:** Python Flask no está corriendo

**Solución:**
```bash
source venv/bin/activate  # Mac/Linux
# o
venv\Scripts\activate     # Windows

python processor_enhanced.py
```

### "Puerto 3000 ocupado"

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

### Bot no responde

1. Verifica que subiste un archivo Excel
2. Desactiva N8N si no lo estás usando
3. Revisa la consola del navegador (F12)

Ver más en: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## 🚀 Despliegue en Producción

```bash
# 1. Compilar frontend
npm run build

# 2. Variables de entorno
export NODE_ENV=production
export PORT=80

# 3. Usar PM2 (recomendado)
npm install -g pm2
pm2 start server.js --name excel-pro
pm2 startup
pm2 save

# 4. Configurar nginx (opcional)
# Ver documentación en docs/deployment/
```

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas!

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-caracteristica`
3. Commit tus cambios: `git commit -m 'Agregar nueva característica'`
4. Push: `git push origin feature/nueva-caracteristica`
5. Abre un Pull Request

## 📄 Licencia

MIT License - Libre para uso personal y comercial.

Ver [LICENSE](LICENSE) para más detalles.

## 🎯 Roadmap

### Versión 3.1 (Próxima)
- [ ] Soporte para Google Sheets
- [ ] Comandos de voz
- [ ] Historial de conversaciones en base de datos
- [ ] Múltiples archivos simultáneos

### Versión 3.2
- [ ] API REST documentada con Swagger
- [ ] Dashboard de analytics
- [ ] Temas oscuro/claro
- [ ] Versión móvil nativa

### Futuro
- [ ] Integración con Power BI
- [ ] Procesamiento por lotes
- [ ] Plugin para Excel
- [ ] Extensión de navegador

## 👨‍💻 Autores

Desarrollado con ❤️ por el equipo de Excel Pro

## 🙏 Agradecimientos

- **Pandas** - Procesamiento de datos
- **OpenPyXL** - Manipulación de Excel
- **python-docx** - Manipulación de Word
- **N8N** - Plataforma de automatización
- **React** - Biblioteca UI
- **Vite** - Build tool
- **Lucide** - Iconos

## 📞 Soporte

- 📧 Email: support@excelpro.com
- 💬 Discord: [Únete a nuestra comunidad](#)
- 🐛 Issues: [GitHub Issues](#)
- 📖 Docs: [Documentación completa](#)

## ⭐ Star History

Si este proyecto te ha sido útil, ¡considera darle una estrella! ⭐

---

**¿Preguntas? ¿Sugerencias?** Abre un issue o revisa la [documentación completa](docs/).

**¡Gracias por usar Excel Pro!** 🎉
