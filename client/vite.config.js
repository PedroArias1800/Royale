import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Puerto para admin
    proxy: {
      "/socket.io": {
        target: 'https://api.royalepanama.com', // Servidor
        ws: true, // Activa WebSocket
        changeOrigin: true, // Cambia el origen para evitar problemas de CORS
      },
    },
  },
});
