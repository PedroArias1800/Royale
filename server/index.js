import express from 'express';
import { PORT } from './config.js';
import cors from 'cors'

import parfumRoutes from './routes/parfum.routes.js'
import cartRoutes from './routes/cart.routes.js'

const app = express();

app.use(cors());
app.use(express.json());

app.use(parfumRoutes)
app.use(cartRoutes);

app.listen(PORT || 4000);
console.log('Server levantado en el puerto', PORT || 4000)