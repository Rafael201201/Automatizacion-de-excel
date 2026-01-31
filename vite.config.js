import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Proxy para el BOT - DEBE IR PRIMERO (más específico)
      '/api/bot': {
        target: 'http://localhost:3000',  // ← Node.js server que maneja el bot
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('❌ Error en proxy BOT:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🤖 Proxy BOT → Node.js:', req.method, req.url);
          });
        }
      },
      // Proxy genérico para el resto de /api (Python)
      '/api': {
        target: 'http://localhost:5000',  // ← Python Flask para conversor
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('❌ Error en proxy Python:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🐍 Proxy Python → Flask:', req.method, req.url);
          });
        }
      },
      // Proxy para descargas
      '/download': {
        target: 'http://localhost:3000',  // ← Node.js server
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})