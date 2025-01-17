import { defineConfig } from 'vite'
const URLServer = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5174, // Puerto para admin
    proxy: {
      "/socket.io": {
        target: URLServer, // Servidor
        ws: true, // Activa WebSocket
        changeOrigin: true, // Cambia el origen para evitar problemas de CORS
      },
    },
  },
});
