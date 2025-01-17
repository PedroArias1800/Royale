import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Puerto para admin
    proxy: {
      "/socket.io": {
        target: process.env.VITE_SERVER_URL || 'http://localhost:4001', // Servidor
        ws: true, // Activa WebSocket
        changeOrigin: true, // Cambia el origen para evitar problemas de CORS
      },
    },
  },
})
