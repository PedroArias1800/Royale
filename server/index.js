import express from 'express';
import { PORT } from './config.js';
import cors from 'cors'

import clienteRoutes from './routes/cliente.routes.js'
import productoRoutes from './routes/producto.routes.js'
import parfumRoutes from './routes/parfum.routes.js'

const app = express();

app.use(cors());
app.use(express.json());

app.use(clienteRoutes);
app.use(productoRoutes);
app.use(parfumRoutes)

app.listen(PORT || 4000);
console.log('Server levantado en el puerto', PORT || 4000)