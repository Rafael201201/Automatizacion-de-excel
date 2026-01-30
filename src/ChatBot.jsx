import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, Upload, X, Download, Settings, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import './ChatBot.css';

const ChatBot = forwardRef((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: '👋 ¡Hola! Soy tu asistente de Excel Pro.\n\nPuedo ayudarte a:\n• Modificar celdas\n• Agregar fórmulas\n• Eliminar filas\n• Combinar columnas\n• Y mucho más...\n\n📎 Sube un archivo Excel para comenzar.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveFile, setHasActiveFile] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [n8nConfig, setN8nConfig] = useState({ url: '', enabled: false });
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const API_URL = '/api/bot';

  // 🆕 Exponer métodos al componente padre
  useImperativeHandle(ref, () => ({
    handleExternalFileLoad: (data) => {
      // Abrir el chatbot automáticamente
      setIsOpen(true);
      
      // Agregar mensaje de éxito
      addMessage('bot', 
        `✅ ¡Archivo cargado desde el conversor!\n\n${data.reply}\n\n💡 Ahora puedes usar comandos para editarlo.`
      );
      
      // Actualizar estado
      checkFileStatus();
    },
    openBot: () => {
      setIsOpen(true);
    }
  }));

  // Auto scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar configuración N8N al montar
  useEffect(() => {
    loadN8NConfig();
    checkFileStatus();
  }, []);

  // Cargar configuración de N8N
  const loadN8NConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/config/n8n`);
      const data = await response.json();
      setN8nConfig(data);
    } catch (error) {
      console.error('Error cargando config N8N:', error);
    }
  };

  // Guardar configuración de N8N
  const saveN8NConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/config/n8n`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nConfig)
      });
      
      if (response.ok) {
        addMessage('bot', `✅ Configuración N8N guardada\n${n8nConfig.enabled ? '🟢 Habilitado' : '🔴 Deshabilitado'}`);
        setShowSettings(false);
      }
    } catch (error) {
      addMessage('bot', '❌ Error guardando configuración N8N');
    }
  };

  // Verificar si hay archivo activo
  const checkFileStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/status`);
      const data = await response.json();
      setHasActiveFile(data.active);
      if (data.active) {
        setFileInfo(data);
      }
    } catch (error) {
      console.error('Error verificando estado del archivo:', error);
    }
  };

  // Agregar mensaje
  const addMessage = (type, text, data = null) => {
    setMessages(prev => [...prev, {
      type,
      text,
      data,
      timestamp: new Date()
    }]);
  };

  // Subir archivo Excel
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      addMessage('bot', '❌ Solo se aceptan archivos .xlsx');
      return;
    }

    setIsLoading(true);
    addMessage('user', `📎 Subiendo: ${file.name}`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.ok) {
        addMessage('bot', data.reply);
        setHasActiveFile(true);
        await checkFileStatus();
      } else {
        addMessage('bot', `❌ ${data.reply}`);
      }
    } catch (error) {
      addMessage('bot', '❌ Error al subir el archivo');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Enviar mensaje
  const handleSendMessage = async () => {
    const message = inputText.trim();
    if (!message || isLoading) return;

    addMessage('user', message);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      
      addMessage('bot', data.reply, data.details);
      
      if (data.downloadUrl) {
        await checkFileStatus();
      }
    } catch (error) {
      addMessage('bot', '❌ Error al procesar tu mensaje');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Descargar archivo activo
  const handleDownload = () => {
    window.open('/download/active.xlsx', '_blank');
    addMessage('bot', '📥 Descargando archivo...');
  };

  // Ejemplos rápidos
  const quickExamples = [
    { label: '📊 Listar hojas', command: 'lista hojas' },
    { label: '➕ Agregar valor', command: 'pon 1500 en Hoja1 A2' },
    { label: '🔢 Agregar fórmula', command: 'pon la fórmula =SUM(A1:A10) en Hoja1 C2' },
    { label: '🗑️ Eliminar fila', command: 'elimina la fila 5 en Hoja1' }
  ];

  const handleQuickExample = (command) => {
    setInputText(command);
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        className="chat-fab"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir chat asistente"
      >
        {isOpen ? <X size={24} /> : '🤖'}
      </button>

      {/* Panel del chat */}
      {isOpen && (
        <div className="chat-panel">
          {/* Header */}
          <div className="chat-header">
            <div>
              <h3>🤖 Excel Pro Assistant</h3>
              {hasActiveFile && fileInfo && (
                <p className="file-indicator">
                  📊 {fileInfo.sheetCount} hoja(s) • {fileInfo.sizeHuman}
                </p>
              )}
            </div>
            <div className="header-actions">
              {hasActiveFile && (
                <button onClick={handleDownload} className="icon-btn" title="Descargar Excel">
                  <Download size={18} />
                </button>
              )}
              <button onClick={() => setShowSettings(!showSettings)} className="icon-btn" title="Configuración">
                <Settings size={18} />
              </button>
              <button onClick={() => setIsOpen(false)} className="icon-btn" title="Cerrar">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="settings-panel">
              <h4>⚙️ Configuración N8N</h4>
              <label>
                <input
                  type="checkbox"
                  checked={n8nConfig.enabled}
                  onChange={(e) => setN8nConfig({ ...n8nConfig, enabled: e.target.checked })}
                />
                Habilitar N8N
              </label>
              <input
                type="text"
                placeholder="URL del webhook N8N"
                value={n8nConfig.url}
                onChange={(e) => setN8nConfig({ ...n8nConfig, url: e.target.value })}
                className="n8n-input"
              />
              <button onClick={saveN8NConfig} className="save-btn">
                Guardar
              </button>
            </div>
          )}

          {/* Mensajes */}
          <div className="chat-body">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message message-${msg.type}`}>
                <div className="message-content">
                  <pre>{msg.text}</pre>
                  {msg.data && (
                    <div className="message-data">
                      <small>
                        {msg.data.action && `Acción: ${msg.data.action}`}
                      </small>
                    </div>
                  )}
                </div>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString('es', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="message message-bot loading-message">
                <Loader2 className="spin" size={20} />
                <span>Procesando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ejemplos rápidos */}
          {!hasActiveFile && (
            <div className="quick-examples">
              <p>💡 Primero sube un archivo Excel:</p>
            </div>
          )}
          
          {hasActiveFile && messages.length <= 2 && (
            <div className="quick-examples">
              <p>💡 Prueba estos comandos:</p>
              {quickExamples.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickExample(example.command)}
                  className="example-btn"
                >
                  {example.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-bar">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="upload-btn"
              disabled={isLoading}
              title="Subir Excel"
            >
              <Upload size={20} />
            </button>
            <input
              type="text"
              placeholder={hasActiveFile ? "Escribe un comando..." : "Sube un Excel primero..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || !hasActiveFile}
              className="message-input"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading || !hasActiveFile}
              className="send-btn"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
});

// Agregar displayName para debugging
ChatBot.displayName = 'ChatBot';

export default ChatBot;