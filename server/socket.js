// socket.js
import { Server } from 'socket.io';
import http from 'http';
import { app } from './app.js';
import { FRONTEND_URL, ADMIN_URL } from './config.js';

const server = http.createServer(app);
export const io = new Server(server, {
    cors: {
        origin: [ADMIN_URL], // Asegúrate de configurar correctamente la URL
        methods: ['GET', 'POST'],
    },
});

// Escuchar eventos de conexión
io.on('connection', (socket) => {
    console.log('Un administrador se conectó:', socket.id);

    socket.on('disconnect', () => {
        console.log('Un administrador se desconectó:', socket.id);
    });
});

// Función para emitir notificaciones
export const notifyAdmins = (transaction) => {
    io.emit('newTransaction', transaction);
};

export default server;
