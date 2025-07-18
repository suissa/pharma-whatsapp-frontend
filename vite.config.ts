import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8083, // ✅ Porta correta: 8083
    watch: {
      usePolling: true,
      interval: 1000,
    },
    hmr: {
      overlay: true,
    },
    // ✨ PROXY PARA O BACKEND
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔄 Proxy:', req.method, req.url, '→', proxyReq.getHeader('host'));
          });
        }
      }
    }
  },
  preview: {
    host: "::",
    port: 8083, // ✅ Porta correta: 8083
    allowedHosts: [],
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));