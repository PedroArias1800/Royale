// index.js
// import server from './socket.js';
import { app } from './app.js';
import { PORT } from './config.js';

// server.listen(PORT, () => {
//     console.log(`Servidor corriendo en el puerto ${PORT}`);
// });

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
