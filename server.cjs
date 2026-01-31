// server.js - Servidor Unificado (Puerto 3000) - VERSIÓN CORREGIDA
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const multer = require("multer");
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

// ============================================
// CONFIGURACIÓN
// ============================================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================
// INICIAR SERVIDOR PYTHON AUTOMÁTICAMENTE
// ============================================
let pythonProcess = null;
let pythonReady = false;

function startPythonServer() {
  console.log('🐍 Iniciando servidor Python Flask en puerto 5000...');
  
  // En Windows
  const isWindows = process.platform === 'win32';
  const pythonCmd = isWindows ? 'python' : 'python3';
  
  pythonProcess = spawn(pythonCmd, ['processor_enhanced.py'], {
    stdio: 'pipe',
    shell: true
  });

  pythonProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[Python] ${output}`);
    
    if (output.includes('Running on') || output.includes('Servidor corriendo')) {
      pythonReady = true;
      console.log('✅ Servidor Python listo en puerto 5000');
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    const err = data.toString();
    if (!err.includes('WARNING')) {
      console.error(`[Python Error] ${err}`);
    }
  });

  pythonProcess.on('close', (code) => {
    console.log(`❌ Proceso Python terminado con código ${code}`);
    pythonReady = false;
    
    // Reintentar después de 3 segundos
    setTimeout(() => {
      console.log('🔄 Reintentando iniciar Python...');
      startPythonServer();
    }, 3000);
  });
}

// Iniciar Python al arrancar
startPythonServer();

// ============================================
// DIRECTORIOS
// ============================================
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ACTIVE_XLSX_PATH = path.join(DATA_DIR, "active.xlsx");
const XLSX_DEFAULT_PATH = path.join(DATA_DIR, "data.xlsx");

// Multer para uploads del bot
const upload = multer({ dest: UPLOADS_DIR });

// ============================================
// PROXY AL BACKEND PYTHON (Puerto 5000)
// ============================================
const pythonProxy = createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  pathRewrite: {
    '^/api/python': '/api'
  },
  onError: (err, req, res) => {
    console.error('❌ Error en proxy a Python:', err.message);
    
    if (!pythonReady) {
      return res.status(503).json({
        success: false,
        error: 'El servidor Python está iniciando. Por favor espera unos segundos...'
      });
    }
    
    res.status(502).json({
      success: false,
      error: 'Backend Python no disponible',
      details: err.message,
      pythonReady: pythonReady
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxy → Python: ${req.method} ${req.originalUrl} → ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Python → Cliente: ${proxyRes.statusCode}`);
  }
});

// ============================================
// APLICAR PROXY A RUTAS DE PYTHON
// ============================================
app.use('/api/python', pythonProxy);

// ============================================
// RUTAS DEL BOT (MANEJADAS POR NODE.JS)
// ============================================

// Health check del bot
app.get('/api/bot/health', (req, res) => {
  res.json({
    status: 'ok',
    bot: 'Excel Pro Assistant',
    version: '1.0.0',
    pythonBackend: pythonReady ? 'connected' : 'connecting',
    timestamp: new Date().toISOString()
  });
});

// Upload Excel para el bot
app.post("/api/bot/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        ok: false, 
        reply: "No llegó ningún archivo." 
      });
    }
    
    const original = (req.file.originalname || "").toLowerCase();
    if (!original.endsWith(".xlsx") && !original.endsWith(".xls")) {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ 
        ok: false, 
        reply: "Solo acepto archivos Excel (.xlsx o .xls)" 
      });
    }
    
    // Validar que se puede leer
    try { 
      XLSX.readFile(req.file.path); 
    } catch {
      try { fs.unlinkSync(req.file.path); } catch {}
      return res.status(400).json({ 
        ok: false, 
        reply: "El archivo no parece un Excel válido." 
      });
    }
    
    // Copiar a ruta fija
    fs.copyFileSync(req.file.path, ACTIVE_XLSX_PATH);
    try { fs.unlinkSync(req.file.path); } catch {}
    
    const st = fs.statSync(ACTIVE_XLSX_PATH);
    const wb = XLSX.readFile(ACTIVE_XLSX_PATH);
    
    return res.json({
      ok: true,
      reply:
        `📊 Excel cargado correctamente!\n\n` +
        `📄 Archivo: ${req.file.originalname}\n` +
        `💾 Tamaño: ${(st.size / 1024).toFixed(2)} KB\n` +
        `📑 Hojas: ${wb.SheetNames.join(', ')}\n\n` +
        `✨ Comandos disponibles:\n` +
        `• pon 1500 en Hoja1 A2\n` +
        `• pon la fórmula =SUM(A1:A10) en Hoja1 C2\n` +
        `• calcula IVA*1.19 en Hoja1 D2\n` +
        `• elimina la fila 5 en Hoja1\n` +
        `• combina columna A con columna B en Hoja1 y ponlo en C\n` +
        `• lista hojas\n\n` +
        `⬇️ Descarga el archivo modificado cuando termines`
    });
  } catch (error) {
    console.error('Error en upload:', error);
    return res.status(500).json({ 
      ok: false, 
      reply: "Error subiendo el archivo: " + error.message 
    });
  }
});

// Download Excel activo
app.get("/api/bot/download", (req, res) => {
  if (!fs.existsSync(ACTIVE_XLSX_PATH)) {
    return res.status(404).json({
      error: "No hay Excel activo. Sube uno primero con el botón 📎"
    });
  }
  
  const wb = XLSX.readFile(ACTIVE_XLSX_PATH);
  res.download(ACTIVE_XLSX_PATH, `archivo_modificado_${Date.now()}.xlsx`);
});

// 🆕 Ruta alternativa para compatibilidad con el ChatBot
app.get("/download/active.xlsx", (req, res) => {
  if (!fs.existsSync(ACTIVE_XLSX_PATH)) {
    return res.status(404).json({
      error: "No hay Excel activo. Sube uno primero con el botón 📎"
    });
  }
  
  res.download(ACTIVE_XLSX_PATH, `archivo_modificado_${Date.now()}.xlsx`);
});

// Status del Excel activo
app.get("/api/bot/status", (req, res) => {
  const exists = fs.existsSync(ACTIVE_XLSX_PATH);
  if (!exists) return res.json({ 
    active: false,
    message: 'No hay archivo activo. Sube un Excel para comenzar.'
  });
  
  const st = fs.statSync(ACTIVE_XLSX_PATH);
  const wb = XLSX.readFile(ACTIVE_XLSX_PATH);
  
  res.json({ 
    active: true, 
    path: ACTIVE_XLSX_PATH, 
    size: st.size,
    sizeHuman: `${(st.size / 1024).toFixed(2)} KB`,
    sheets: wb.SheetNames,
    sheetCount: wb.SheetNames.length,
    mtime: st.mtime 
  });
});

// Chat con el bot
app.post("/api/bot/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return res.json({ 
        reply: "💬 Escribe una instrucción para trabajar con Excel.\n\nEjemplo: 'pon 100 en Hoja1 A1'" 
      });
    }
    
    console.log('📝 Mensaje del usuario:', message);
    
    // Verificar si hay archivo activo
    if (!fs.existsSync(ACTIVE_XLSX_PATH)) {
      return res.json({
        reply: "⚠️ No hay ningún archivo Excel cargado.\n\n📎 Por favor sube un archivo Excel primero usando el botón de adjuntar."
      });
    }
    
    const intent = parseNatural(message);
    const wb = ensureWorkbook();
    
    if (intent.type === "listSheets") {
      return res.json({ 
        reply: `📋 Hojas disponibles:\n${wb.SheetNames.map((s, i) => `${i+1}. ${s}`).join('\n')}` 
      });
    }
    
    if (intent.type === "setValue") {
      const ws = getOrCreateSheet(wb, intent.sheet);
      setCellValue(ws, intent.cell, intent.value);
      const savedTo = saveWorkbook(wb);
      const st = fs.statSync(savedTo);
      
      return res.json({
        reply: 
          `✅ ¡Listo!\n\n` +
          `📝 Puse "${intent.value}" en:\n` +
          `📄 Hoja: ${intent.sheet}\n` +
          `📍 Celda: ${intent.cell}\n\n` +
          `💾 Archivo actualizado: ${(st.size / 1024).toFixed(2)} KB\n` +
          `⬇️ Puedes descargar el archivo modificado`,
        downloadAvailable: true
      });
    }
    
    if (intent.type === "setFormula") {
      const ws = getOrCreateSheet(wb, intent.sheet);
      setCellFormula(ws, intent.cell, intent.formula);
      saveWorkbook(wb);
      
      return res.json({
        reply: 
          `🧮 Fórmula agregada!\n\n` +
          `📐 Fórmula: =${intent.formula}\n` +
          `📄 Hoja: ${intent.sheet}\n` +
          `📍 Celda: ${intent.cell}\n\n` +
          `✨ Excel calculará el resultado al abrir el archivo`,
        downloadAvailable: true
      });
    }
    
    if (intent.type === "deleteRow") {
      deleteRow(wb, intent.sheet, intent.row);
      saveWorkbook(wb);
      
      return res.json({
        reply: 
          `🗑️ Fila eliminada!\n\n` +
          `✅ Fila ${intent.row} de la hoja "${intent.sheet}" ha sido eliminada`,
        downloadAvailable: true
      });
    }
    
    if (intent.type === "combineCols") {
      combineColumns(wb, intent.sheet, intent.col1, intent.col2, intent.dest, " ");
      saveWorkbook(wb);
      
      return res.json({
        reply: 
          `🔗 Columnas combinadas!\n\n` +
          `📊 Columna ${intent.col1} + Columna ${intent.col2}\n` +
          `📍 Resultado en columna ${intent.dest}\n` +
          `📄 Hoja: ${intent.sheet}`,
        downloadAvailable: true
      });
    }
    
    // Comando no reconocido
    return res.json({
      reply:
        "❓ No entendí ese comando.\n\n" +
        "📚 Comandos disponibles:\n\n" +
        "📝 VALORES:\n" +
        "• pon [valor] en [Hoja] [celda]\n" +
        "  Ejemplo: pon 1500 en Hoja1 A2\n\n" +
        "🧮 FÓRMULAS:\n" +
        "• pon la fórmula [=FORMULA] en [Hoja] [celda]\n" +
        "  Ejemplo: pon la fórmula =SUM(A1:A10) en Hoja1 C2\n\n" +
        "• calcula [expresión] en [Hoja] [celda]\n" +
        "  Ejemplo: calcula IVA*1.19 en Hoja1 D2\n\n" +
        "🗑️ ELIMINAR:\n" +
        "• elimina la fila [número] en [Hoja]\n" +
        "  Ejemplo: elimina la fila 5 en Hoja1\n\n" +
        "🔗 COMBINAR:\n" +
        "• combina columna [A] con columna [B] en [Hoja] y ponlo en [C]\n" +
        "  Ejemplo: combina columna A con columna B en Hoja1 y ponlo en D\n\n" +
        "📋 LISTAR:\n" +
        "• lista hojas"
    });
    
  } catch (e) {
    console.error('❌ Error en chat:', e);
    return res.status(500).json({ 
      reply: `❌ Error procesando tu solicitud:\n${e?.message || 'Error desconocido'}` 
    });
  }
});

// ============================================
// APLICAR PROXY SOLO A RUTAS QUE NO SON /api/bot/*
// ============================================
app.use('/api', (req, res, next) => {
  // Si la ruta empieza con /api/bot, NO hacer proxy (ya está manejada arriba)
  if (req.path.startsWith('/bot')) {
    return next();
  }
  
  // Para todo lo demás en /api/*, hacer proxy a Python
  pythonProxy(req, res, next);
});

// ============================================
// FUNCIONES HELPER PARA EXCEL
// ============================================
function ensureWorkbook() {
  const p = fs.existsSync(ACTIVE_XLSX_PATH) ? ACTIVE_XLSX_PATH : XLSX_DEFAULT_PATH;
  
  if (fs.existsSync(p)) return XLSX.readFile(p);
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([["Col1", "Col2", "Col3"]]);
  XLSX.utils.book_append_sheet(wb, ws, "Hoja1");
  XLSX.writeFile(wb, XLSX_DEFAULT_PATH);
  return wb;
}

function saveWorkbook(wb) {
  const target = fs.existsSync(ACTIVE_XLSX_PATH) ? ACTIVE_XLSX_PATH : XLSX_DEFAULT_PATH;
  XLSX.writeFile(wb, target);
  return target;
}

function getOrCreateSheet(wb, sheetName) {
  let ws = wb.Sheets[sheetName];
  if (!ws) {
    ws = XLSX.utils.aoa_to_sheet([]);
    wb.Sheets[sheetName] = ws;
    wb.SheetNames.push(sheetName);
  }
  return ws;
}

function setCellValue(ws, cellA1, valueRaw) {
  const v = valueRaw !== "" && !isNaN(valueRaw) ? Number(valueRaw) : valueRaw;
  ws[cellA1] = { t: typeof v === "number" ? "n" : "s", v };
  
  const oldRef = ws["!ref"] || "A1:A1";
  const range = XLSX.utils.decode_range(oldRef);
  const c = XLSX.utils.decode_cell(cellA1);
  range.s.r = Math.min(range.s.r, c.r);
  range.s.c = Math.min(range.s.c, c.c);
  range.e.r = Math.max(range.e.r, c.r);
  range.e.c = Math.max(range.e.c, c.c);
  ws["!ref"] = XLSX.utils.encode_range(range);
}

function setCellFormula(ws, cellA1, formulaRaw) {
  let f = String(formulaRaw || "").trim();
  if (!f) throw new Error("Fórmula vacía.");
  if (f.startsWith("=")) f = f.slice(1);
  
  ws[cellA1] = { t: "n", f };
  
  const oldRef = ws["!ref"] || "A1:A1";
  const range = XLSX.utils.decode_range(oldRef);
  const c = XLSX.utils.decode_cell(cellA1);
  range.s.r = Math.min(range.s.r, c.r);
  range.s.c = Math.min(range.s.c, c.c);
  range.e.r = Math.max(range.e.r, c.r);
  range.e.c = Math.max(range.e.c, c.c);
  ws["!ref"] = XLSX.utils.encode_range(range);
}

function deleteRow(wb, sheetName, row1Based) {
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`No existe la hoja "${sheetName}".`);
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (row1Based < 1 || row1Based > data.length) throw new Error(`Fila inválida.`);
  data.splice(row1Based - 1, 1);
  wb.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(data);
}

function colToIndex(colLetters) {
  let n = 0;
  for (const ch of colLetters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function combineColumns(wb, sheetName, col1, col2, destCol, sep = " ") {
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`No existe la hoja "${sheetName}".`);
  
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const aIdx = colToIndex(col1);
  const bIdx = colToIndex(col2);
  const dIdx = colToIndex(destCol);
  
  for (let r = 0; r < data.length; r++) {
    const av = (data[r]?.[aIdx] ?? "").toString();
    const bv = (data[r]?.[bIdx] ?? "").toString();
    const merged = [av, bv].filter(Boolean).join(sep);
    if (!data[r]) data[r] = [];
    data[r][dIdx] = merged;
  }
  
  wb.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(data);
}

// ============================================
// PARSER DE LENGUAJE NATURAL
// ============================================
function parseNatural(text) {
  const t = String(text || "").trim();
  
  // Patrones básicos
  let m = t.match(/^pon\s+(.+?)\s+en\s+([^\s]+)\s+([A-Za-z]{1,3}\d{1,7})$/i);
  if (m) return { 
    type: "setValue", 
    value: m[1].trim().replace(/^"|"$/g, ""), 
    sheet: m[2].trim(), 
    cell: m[3].toUpperCase() 
  };
  
  m = t.match(/^pon\s+la\s+f[oó]rmula\s+(.+?)\s+en\s+([^\s]+)\s+([A-Za-z]{1,3}\d{1,7})$/i);
  if (m) return { 
    type: "setFormula", 
    formula: m[1].trim(), 
    sheet: m[2].trim(), 
    cell: m[3].toUpperCase() 
  };
  
  m = t.match(/^elimina\s+la\s+fila\s+(\d+)\s+en\s+([^\s]+)$/i);
  if (m) return { 
    type: "deleteRow", 
    row: Number(m[1]), 
    sheet: m[2].trim() 
  };
  
  m = t.match(/^combina\s+columna\s+([A-Za-z]{1,3})\s+con\s+columna\s+([A-Za-z]{1,3})\s+en\s+([^\s]+)\s+y\s+ponlo\s+en\s+([A-Za-z]{1,3})$/i);
  if (m) return { 
    type: "combineCols", 
    col1: m[1].toUpperCase(), 
    col2: m[2].toUpperCase(), 
    sheet: m[3].trim(), 
    dest: m[4].toUpperCase() 
  };
  
  if (/^(lista\s+hojas|hojas)$/i.test(t)) return { type: "listSheets" };
  
  // Patrones adicionales más naturales
  m = t.match(/^calcula\s+(.+?)\s+en\s+([^\s]+)\s+([A-Za-z]{1,3}\d{1,7})$/i);
  if (m) return {
    type: "setFormula",
    formula: m[1].trim(),
    sheet: m[2].trim(),
    cell: m[3].toUpperCase()
  };
  
  return { type: "unknown" };
}

// ============================================
// HEALTH CHECK GENERAL
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'Unified Server',
    version: '1.0.0',
    services: {
      nodejs: 'running',
      python: pythonReady ? 'running' : 'starting',
      bot: 'running'
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// SERVIR ARCHIVOS ESTÁTICOS (React build)
// ============================================
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('✅ Sirviendo archivos estáticos desde /dist');
}

// ============================================
// RUTA CATCH-ALL PARA REACT ROUTER
// ============================================
app.get('*', (req, res) => {
  // No servir index.html para rutas de API o download
  if (req.path.startsWith('/api') || req.path.startsWith('/download')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send(`
      <h1>⚠️ Aplicación no compilada</h1>
      <p>Por favor ejecuta: <code>npm run build</code></p>
      <p>Luego reinicia el servidor.</p>
    `);
  }
});

// ============================================
// MANEJO DE ERRORES
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// ============================================
// LIMPIEZA AL CERRAR
// ============================================
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  
  if (pythonProcess) {
    console.log('🐍 Deteniendo proceso Python...');
    pythonProcess.kill();
  }
  
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  process.exit(0);
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 SERVIDOR UNIFICADO - Excel Pro Converter + Bot            ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  🌐 Servidor corriendo: http://localhost:${PORT}                ║`);
  console.log('║  📊 Frontend React + Conversor de archivos                    ║');
  console.log('║  🤖 Bot de Excel con IA                                       ║');
  console.log('║  🔄 Proxy automático a Python (puerto 5000)                   ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  ENDPOINTS PRINCIPALES:                                        ║');
  console.log(`║  • Frontend: http://localhost:${PORT}                           ║`);
  console.log(`║  • Conversor API: http://localhost:${PORT}/api/*                ║`);
  console.log(`║  • Bot Chat: http://localhost:${PORT}/api/bot/chat              ║`);
  console.log(`║  • Bot Upload: http://localhost:${PORT}/api/bot/upload          ║`);
  console.log(`║  • Bot Download: http://localhost:${PORT}/api/bot/download      ║`);
  console.log(`║  • Bot Status: http://localhost:${PORT}/api/bot/status          ║`);
  console.log(`║  • Health: http://localhost:${PORT}/api/health                  ║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  ESTADO DE SERVICIOS:                                          ║');
  console.log(`║  • Node.js: ✅ Corriendo en puerto ${PORT}                       ║`);
  console.log(`║  • Python: ${pythonReady ? '✅' : '⏳'} ${pythonReady ? 'Listo' : 'Iniciando...'.padEnd(47)}║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  📝 NOTAS IMPORTANTES:                                         ║');
  console.log('║  1. Python Flask se inicia automáticamente                     ║');
  console.log('║  2. Asegúrate de haber compilado React: npm run build          ║');
  console.log('║  3. Todos los servicios en UN SOLO PUERTO (3000)              ║');
  console.log('║  4. El bot funciona completamente sin dependencias externas    ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  if (!fs.existsSync(distPath)) {
    console.log('⚠️  WARNING: Carpeta /dist no encontrada');
    console.log('   Ejecuta: npm run build\n');
  }
});
