# 🔗 Guía de Integración con N8N

## 📋 Tabla de Contenidos
1. [¿Qué es N8N?](#que-es-n8n)
2. [Instalación de N8N](#instalacion-de-n8n)
3. [Configuración del Webhook](#configuracion-del-webhook)
4. [Workflows Recomendados](#workflows-recomendados)
5. [Testing](#testing)

---

## 🤖 ¿Qué es N8N?

N8N es una plataforma de automatización de workflows que te permite:
- Conectar diferentes servicios
- Procesar datos automáticamente
- Integrar IA (ChatGPT, Claude, etc.)
- Crear flujos de trabajo complejos

En este proyecto, N8N se usa para:
- **Procesar comandos de lenguaje natural** con IA
- **Respuestas más inteligentes** que el parser básico
- **Automatizaciones complejas** con Excel

---

## 📦 Instalación de N8N

### Opción 1: Docker (Recomendado)

```bash
# 1. Crear directorio para datos persistentes
mkdir ~/.n8n

# 2. Ejecutar N8N con Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### Opción 2: NPM Global

```bash
npm install -g n8n

# Ejecutar
n8n start
```

### Opción 3: NPX (Sin instalar)

```bash
npx n8n
```

**Acceso**: Una vez iniciado, ve a `http://localhost:5678`

---

## ⚙️ Configuración del Webhook

### 1. Crear un Workflow en N8N

1. Abre N8N: `http://localhost:5678`
2. Crea un nuevo workflow
3. Agrega un nodo **"Webhook"**

### 2. Configurar el Nodo Webhook

**Configuración básica:**
```
HTTP Method: POST
Path: excel-bot
```

**URL del Webhook será:**
```
http://localhost:5678/webhook/excel-bot
```

### 3. Procesar el Mensaje

Después del webhook, agrega estos nodos:

#### Nodo "Set" - Extraer Datos
```json
{
  "message": "{{ $json.body.message }}",
  "context": "{{ $json.body.context }}",
  "timestamp": "{{ $json.body.timestamp }}"
}
```

#### Nodo "HTTP Request" - Llamar a ChatGPT/Claude (Opcional)
```
Method: POST
URL: https://api.openai.com/v1/chat/completions
Authentication: Bearer Token
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_API_KEY

Body:
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "Eres un asistente especializado en Excel. Interpreta comandos en español y genera instrucciones precisas para manipular hojas de cálculo."
    },
    {
      "role": "user",
      "content": "{{ $json.message }}"
    }
  ]
}
```

#### Nodo "Code" - Formatear Respuesta
```javascript
// Procesar respuesta de la IA
const aiResponse = $input.first().json;
const message = aiResponse.choices[0].message.content;

// Detectar el tipo de comando
let commandType = 'unknown';
let reply = message;

if (message.includes('SUM') || message.includes('SUMA')) {
  commandType = 'formula';
} else if (message.includes('eliminar') || message.includes('delete')) {
  commandType = 'deleteRow';
} else if (message.includes('poner') || message.includes('set')) {
  commandType = 'setValue';
}

return {
  json: {
    reply: reply,
    commandType: commandType,
    processed: true
  }
};
```

#### Nodo "Respond to Webhook"
```json
{
  "reply": "{{ $json.reply }}",
  "commandType": "{{ $json.commandType }}"
}
```

---

## 🎯 Workflows Recomendados

### Workflow 1: Bot Básico con IA

```
┌─────────────┐
│   Webhook   │
│  (Recibe    │
│   mensaje)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     Set     │
│  (Extrae    │
│   datos)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  ChatGPT/   │
│   Claude    │
│ (Interpreta)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Code     │
│ (Formatea)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Respond    │
└─────────────┘
```

### Workflow 2: Bot Avanzado con Validación

```
┌─────────────┐
│   Webhook   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     IF      │
│  ¿Mensaje   │
│   válido?   │
└──┬────────┬─┘
   │        │
   SÍ       NO
   │        │
   ▼        ▼
┌─────┐  ┌─────┐
│ IA  │  │Error│
└──┬──┘  └──┬──┘
   │        │
   ▼        ▼
┌──────────────┐
│   Respond    │
└──────────────┘
```

### Workflow 3: Bot con Base de Datos

```
┌─────────────┐
│   Webhook   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     IA      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Airtable  │
│    o SQL    │
│ (Guardar    │
│  historial) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Respond    │
└─────────────┘
```

---

## 🔧 Configuración en la App

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# N8N Configuration
N8N_ENABLED=true
N8N_WEBHOOK_URL=http://localhost:5678/webhook/excel-bot
```

### 2. Configurar desde la UI

1. Abre la aplicación
2. Haz clic en el bot (🤖)
3. Clic en el icono de configuración (⚙️)
4. Activa "Habilitar N8N"
5. Ingresa la URL del webhook
6. Guarda

---

## 🧪 Testing

### 1. Test Manual

**Paso 1: Verifica que N8N está corriendo**
```bash
curl http://localhost:5678
```

**Paso 2: Prueba el webhook**
```bash
curl -X POST http://localhost:5678/webhook/excel-bot \
  -H "Content-Type: application/json" \
  -d '{
    "message": "pon 1500 en Hoja1 A2",
    "context": {
      "hasActiveFile": true
    },
    "timestamp": "2026-01-29T12:00:00Z",
    "source": "excel-bot"
  }'
```

**Respuesta esperada:**
```json
{
  "reply": "✅ Comando procesado: Agregar valor 1500 en Hoja1, celda A2",
  "commandType": "setValue"
}
```

### 2. Test desde la App

1. Sube un archivo Excel
2. Escribe: "pon 1500 en Hoja1 A2"
3. Envía
4. Verifica en N8N que llegó el webhook
5. Verifica la respuesta en el chat

---

## 🎨 Ejemplos de Prompts para IA

Si usas ChatGPT/Claude en N8N, usa este system prompt:

```
Eres un asistente especializado en Excel que ayuda a usuarios a manipular hojas de cálculo.

INSTRUCCIONES:
1. Interpreta comandos en español natural
2. Genera respuestas claras y concisas
3. Si el comando implica una fórmula, indícala explícitamente
4. Si el comando no es claro, pide aclaración

FORMATO DE RESPUESTA:
- Para valores: "✅ Agregar [valor] en [hoja] [celda]"
- Para fórmulas: "✅ Agregar fórmula [fórmula] en [hoja] [celda]"
- Para eliminar: "✅ Eliminar fila [número] en [hoja]"
- Para combinar: "✅ Combinar columna [A] con [B] en [hoja], resultado en [C]"

EJEMPLOS:
Usuario: "suma los valores de A1 a A10 y ponlo en C1"
Tú: "✅ Agregar fórmula =SUM(A1:A10) en Hoja1 C1"

Usuario: "elimina la quinta fila"
Tú: "✅ Eliminar fila 5 en Hoja1"

Usuario: "necesito calcular el IVA del 19% en la columna D"
Tú: "✅ Agregar fórmula =C2*1.19 en Hoja1 D2 (ajusta según tu tabla)"
```

---

## 📊 Workflows JSON para Importar

### Workflow Básico

```json
{
  "name": "Excel Bot - Basic",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "excel-bot",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            {
              "name": "message",
              "value": "={{ $json.body.message }}"
            }
          ]
        }
      },
      "name": "Set",
      "type": "n8n-nodes-base.set",
      "position": [450, 300]
    },
    {
      "parameters": {
        "jsCode": "const msg = $input.first().json.message;\nlet reply = '';\n\nif (msg.includes('suma') || msg.includes('SUM')) {\n  reply = '✅ Agregar fórmula de suma';\n} else if (msg.includes('elimina')) {\n  reply = '✅ Eliminar fila';\n} else {\n  reply = '✅ Comando procesado';\n}\n\nreturn { json: { reply } };"
      },
      "name": "Code",
      "type": "n8n-nodes-base.code",
      "position": [650, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}"
      },
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [850, 300]
    }
  ],
  "connections": {
    "Webhook": { "main": [[{ "node": "Set", "type": "main", "index": 0 }]] },
    "Set": { "main": [[{ "node": "Code", "type": "main", "index": 0 }]] },
    "Code": { "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]] }
  }
}
```

**Para importar:**
1. Copia el JSON
2. En N8N, clic en "Import from JSON"
3. Pega el JSON
4. Activa el workflow

---

## 🚀 Comandos de Inicio

### Iniciar Todo (3 terminales)

**Terminal 1 - N8N:**
```bash
npx n8n
# o
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

**Terminal 2 - Backend Python:**
```bash
python processor_enhanced.py
```

**Terminal 3 - Frontend + Bot:**
```bash
npm install
npm run build
npm start
```

### Verificar que todo funciona

```bash
# 1. N8N
curl http://localhost:5678

# 2. Python Backend
curl http://localhost:5000/api/health

# 3. Node.js Server
curl http://localhost:3000/api/bot/health
```

---

## ❓ FAQ

### ¿N8N es obligatorio?
No. El bot funciona sin N8N usando el parser local. N8N solo mejora las respuestas con IA.

### ¿Puedo usar otro puerto para N8N?
Sí. Solo actualiza la URL en la configuración del bot.

### ¿Necesito API key de OpenAI?
Solo si quieres usar ChatGPT en N8N. Puedes usar el bot sin IA también.

### ¿Cuánto cuesta N8N?
N8N es open-source y gratis para self-hosting.

---

## 📚 Recursos

- [Documentación N8N](https://docs.n8n.io)
- [Workflows de Ejemplo](https://n8n.io/workflows)
- [Comunidad N8N](https://community.n8n.io)

---

**Versión**: 3.0.0  
**Fecha**: Enero 2026  
**Autor**: Excel Pro Team
