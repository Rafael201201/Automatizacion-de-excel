import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  // ← Directo a Python Flask
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Error en proxy:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('→ Enviando a backend:', req.method, req.url);
          });
        }
      },
      '/download': {
        target: 'http://localhost:5000',  // ← Directo a Python Flask
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