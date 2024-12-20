import express from 'express';

import { PORT } from './config.js';
import cors from 'cors'

import parfumRoutes from './routes/parfum.routes.js'
import cartRoutes from './routes/cart.routes.js'
import linksWhatsapp from './routes/links.routes.js'
import { whatsapp } from './lib/whatsapp.js';
import dotenv from 'dotenv';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(parfumRoutes);
app.use(cartRoutes);
app.use(linksWhatsapp);

dotenv.config();
whatsapp.initialize();
app.listen(PORT || 4000);
console.log('Server levantado en el puerto', PORT || 4000)