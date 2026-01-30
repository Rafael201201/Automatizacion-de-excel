import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileSpreadsheet, FileText, Download, 
  Share2, Mail, MessageCircle, Send, X,
  CheckCircle, AlertCircle, Loader2, Info,
  ExternalLink, Copy, FolderDown
} from 'lucide-react';
import ChatBot from './ChatBot';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processedFile, setProcessedFile] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [message, setMessage] = useState(null);
  const [conversionType, setConversionType] = useState('excel_to_word');
  const [isDragging, setIsDragging] = useState(false);

  // Referencia al ChatBot para comunicación
  const chatBotRef = useRef(null);

  // API URL
 const API_URL = '/api'; 

// En la función uploadFile (Línea 75)

  // Manejo de drag and drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const droppedFile = files[0];
      handleFileSelect({ target: { files: [droppedFile] } });
    }
  };

  // Manejo de selección de archivo
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileInfo(null);
    setProcessedFile(null);
    setMessage(null);

    await uploadFile(selectedFile);
  };

  // Subir archivo
  const uploadFile = async (fileToUpload) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setFileInfo(data.file_info);
        setMessage({
          type: 'success',
          text: '✅ Archivo cargado correctamente'
        });

        if (data.file_info.type === 'excel') {
          setConversionType('excel_to_word');
        } else if (data.file_info.type === 'word') {
          setConversionType('word_to_excel');
        }
      } else {
        throw new Error(data.error || 'Error al subir archivo');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Error: ${error.message}`
      });
    } finally {
      setUploading(false);
    }
  };

  // Procesar archivo
  const processFile = async () => {
    if (!fileInfo) return;

    setProcessing(true);
    setMessage({ type: 'info', text: '⏳ Procesando archivo...' });

    try {
      const response = await fetch(`${API_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filepath: fileInfo.filepath,
          action: conversionType,
          options: {
            include_header: true,
            include_stats: true,
            extraer_tablas: true,
            extraer_texto: true,
            incluir_metadata: true
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setProcessedFile(data.output);
        setShowOptionsModal(true);
        setMessage({
          type: 'success',
          text: '✅ Archivo procesado exitosamente'
        });
      } else {
        throw new Error(data.error || 'Error al procesar archivo');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Error: ${error.message}`
      });
    } finally {
      setProcessing(false);
    }
  };

  // Descargar archivo localmente
  const downloadLocal = async () => {
    if (!processedFile) return;
    
    try {
      const downloadUrl = processedFile.download_url;
      
      console.log('Descargando desde:', downloadUrl);
      
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = processedFile.filename;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      setMessage({
        type: 'success',
        text: '⬇️ Archivo descargado exitosamente'
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Error al descargar: ${error.message}`
      });
      console.error('Error en descarga:', error);
    }
  };

  // 🆕 NUEVA FUNCIÓN: Enviar archivo al chatbot para edición
  const sendToChatBot = async () => {
    if (!processedFile) return;

    try {
      // Descargar el archivo procesado como blob
      const response = await fetch(processedFile.download_url);
      
      if (!response.ok) {
        throw new Error('No se pudo obtener el archivo');
      }

      const blob = await response.blob();
      
      // Crear un File object desde el blob
      const file = new File([blob], processedFile.filename, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Enviar al bot
      const formData = new FormData();
      formData.append('file', file);

      const botResponse = await fetch('/api/bot/upload', {
        method: 'POST',
        body: formData
      });

      const botData = await botResponse.json();

      if (botData.ok) {
        // Cerrar el modal
        setShowOptionsModal(false);
        
        // Mostrar mensaje de éxito
        setMessage({
          type: 'success',
          text: '🤖 Archivo cargado en el chatbot. ¡Ahora puedes editarlo!'
        });

        // Notificar al chatbot (si tiene un método público)
        if (chatBotRef.current?.handleExternalFileLoad) {
          chatBotRef.current.handleExternalFileLoad(botData);
        }

        // Esperar 1 segundo y resetear
        setTimeout(() => {
          reset();
        }, 1500);

      } else {
        throw new Error(botData.reply || 'Error al cargar en el bot');
      }

    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Error al enviar al chatbot: ${error.message}`
      });
      console.error('Error enviando al chatbot:', error);
    }
  };

  // Compartir en plataforma
  const shareOnPlatform = (platform) => {
    if (!processedFile?.share_links) return;

    const url = processedFile.share_links[platform];
    if (url) {
      window.open(url, '_blank');
      setMessage({
        type: 'success',
        text: `🔗 Compartiendo en ${platform}`
      });
    }
  };

  // Copiar enlace
  const copyLink = () => {
    if (!processedFile?.share_links?.direct) return;

    navigator.clipboard.writeText(processedFile.share_links.direct);
    setMessage({
      type: 'success',
      text: '📋 Enlace copiado al portapapeles'
    });
  };

  // Reiniciar
  const reset = () => {
    setFile(null);
    setFileInfo(null);
    setProcessedFile(null);
    setMessage(null);
    setConversionType('excel_to_word');
    setShowOptionsModal(false);
  };

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="logo">
            <FileSpreadsheet size={40} />
          </div>
          <h1>Conversor de Archivos Pro</h1>
          <p className="subtitle">Excel ↔ Word • CSV • JSON • Power BI</p>
        </div>

        {/* Messages */}
        {message && (
          <div className={`message message-${message.type}`}>
            {message.type === 'success' && <CheckCircle size={20} />}
            {message.type === 'error' && <AlertCircle size={20} />}
            {message.type === 'info' && <Info size={20} />}
            <span>{message.text}</span>
            <button 
              className="message-close"
              onClick={() => setMessage(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div className="card">
          <input
            id="fileInput"
            type="file"
            onChange={handleFileSelect}
            accept=".xlsx,.xls,.docx"
            style={{ display: 'none' }}
          />
          
          <div 
            className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <label htmlFor="fileInput" className="upload-label">
              {uploading ? (
                <>
                  <Loader2 className="spin" size={48} />
                  <p>Subiendo archivo...</p>
                </>
              ) : file ? (
                <>
                  <CheckCircle size={48} color="#10b981" />
                  <p className="filename">{file.name}</p>
                  <button className="change-file" onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('fileInput').click();
                  }}>
                    Cambiar archivo
                  </button>
                </>
              ) : (
                <>
                  <Upload size={48} />
                  <p>Haz clic o arrastra un archivo aquí</p>
                  <span className="file-types">Soportado: Excel (.xlsx, .xls) y Word (.docx)</span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* File Info */}
        {fileInfo && (
          <div className="file-info-card">
            <h3>📄 Información del Archivo</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Nombre:</strong>
                <span>{fileInfo.filename}</span>
              </div>
              <div className="info-item">
                <strong>Tamaño:</strong>
                <span>{fileInfo.size_human}</span>
              </div>
              <div className="info-item">
                <strong>Tipo:</strong>
                <span>{fileInfo.extension}</span>
              </div>

              {fileInfo.type === 'excel' && (
                <>
                  <div className="info-item">
                    <strong>Filas:</strong>
                    <span>{fileInfo.rows}</span>
                  </div>
                  <div className="info-item">
                    <strong>Columnas:</strong>
                    <span>{fileInfo.columns}</span>
                  </div>
                  <div className="info-item">
                    <strong>Hojas:</strong>
                    <span>{fileInfo.sheet_count}</span>
                  </div>
                </>
              )}

              {fileInfo.type === 'word' && (
                <>
                  <div className="info-item">
                    <strong>Párrafos:</strong>
                    <span>{fileInfo.paragraphs}</span>
                  </div>
                  <div className="info-item">
                    <strong>Tablas:</strong>
                    <span>{fileInfo.tables}</span>
                  </div>
                  <div className="info-item">
                    <strong>Palabras:</strong>
                    <span>{fileInfo.total_words}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Conversion Options */}
        {fileInfo && !processedFile && (
          <div className="conversion-section">
            <h3>🔄 Tipo de Conversión</h3>
            <div className="conversion-buttons">
              {fileInfo.type === 'excel' && (
                <>
                  <button
                    className={`conv-btn ${conversionType === 'excel_to_word' ? 'active' : ''}`}
                    onClick={() => setConversionType('excel_to_word')}
                  >
                    <FileText size={20} />
                    Excel → Word
                  </button>
                  <button
                    className={`conv-btn ${conversionType === 'excel_to_csv' ? 'active' : ''}`}
                    onClick={() => setConversionType('excel_to_csv')}
                  >
                    <FileSpreadsheet size={20} />
                    Excel → CSV
                  </button>
                  <button
                    className={`conv-btn ${conversionType === 'excel_to_json' ? 'active' : ''}`}
                    onClick={() => setConversionType('excel_to_json')}
                  >
                    <FileText size={20} />
                    Excel → JSON
                  </button>
                </>
              )}

              {fileInfo.type === 'word' && (
                <button
                  className={`conv-btn ${conversionType === 'word_to_excel' ? 'active' : ''}`}
                  onClick={() => setConversionType('word_to_excel')}
                >
                  <FileSpreadsheet size={20} />
                  Word → Excel
                </button>
              )}
            </div>

            <button
              className="process-btn"
              onClick={processFile}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="spin" size={20} />
                  Procesando...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Procesar Archivo
                </>
              )}
            </button>
          </div>
        )}

        {/* Modal de Opciones */}
        {showOptionsModal && processedFile && (
          <div className="modal-overlay" onClick={() => setShowOptionsModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🎉 Archivo Procesado</h2>
                <button onClick={() => setShowOptionsModal(false)} className="close-btn">
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body">
                <div className="processed-file-info">
                  <CheckCircle size={48} color="#10b981" />
                  <h3>{processedFile.filename}</h3>
                  <p>{processedFile.metadata.size_human}</p>
                </div>

                {/* 🆕 NUEVO: Botón para enviar al chatbot */}
                {processedFile.filename.endsWith('.xlsx') && (
                  <div className="options-section">
                    <h4>🤖 Editar con ChatBot</h4>
                    <button 
                      className="option-btn chatbot-btn" 
                      onClick={sendToChatBot}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      <MessageCircle size={20} />
                      Cargar en ChatBot para Editar
                    </button>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                      💡 Envía el archivo al chatbot y edítalo con comandos de voz
                    </p>
                  </div>
                )}

                <div className="options-section">
                  <h4>💾 Descargar</h4>
                  <button className="option-btn download" onClick={downloadLocal}>
                    <FolderDown size={20} />
                    Descargar Localmente
                  </button>
                  <button className="option-btn" onClick={copyLink}>
                    <Copy size={20} />
                    Copiar Enlace
                  </button>
                </div>

                <div className="options-section">
                  <h4>🔗 Compartir en Plataformas</h4>
                  <div className="share-grid">
                    <button 
                      className="share-btn whatsapp"
                      onClick={() => shareOnPlatform('whatsapp')}
                    >
                      <MessageCircle size={20} />
                      WhatsApp
                    </button>
                    <button 
                      className="share-btn telegram"
                      onClick={() => shareOnPlatform('telegram')}
                    >
                      <Send size={20} />
                      Telegram
                    </button>
                    <button 
                      className="share-btn email"
                      onClick={() => shareOnPlatform('email')}
                    >
                      <Mail size={20} />
                      Email
                    </button>
                    <button 
                      className="share-btn twitter"
                      onClick={() => shareOnPlatform('twitter')}
                    >
                      <ExternalLink size={20} />
                      Twitter
                    </button>
                    <button 
                      className="share-btn facebook"
                      onClick={() => shareOnPlatform('facebook')}
                    >
                      <ExternalLink size={20} />
                      Facebook
                    </button>
                    <button 
                      className="share-btn linkedin"
                      onClick={() => shareOnPlatform('linkedin')}
                    >
                      <ExternalLink size={20} />
                      LinkedIn
                    </button>
                  </div>
                </div>

                <button className="new-file-btn" onClick={() => {
                  setShowOptionsModal(false);
                  reset();
                }}>
                  Procesar Nuevo Archivo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>Desarrollado con Node.js (Servidor Unificado)</p>
        <p>Compatible con Windows, macOS y Linux</p>
      </footer>

      {/* Bot de Excel Integrado */}
      <ChatBot ref={chatBotRef} />
    </div>
  );
}

export default App;