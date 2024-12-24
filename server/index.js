import express from 'express';

import { PORT } from './config.js';
import cors from 'cors'

import parfumRoutes from './routes/parfum.routes.js'
import cartRoutes from './routes/cart.routes.js'
import linksWhatsapp from './routes/links.routes.js'
import { whatsapp } from './lib/whatsapp.js';
import { FRONTEND_URL } from './config.js';
import dotenv from 'dotenv';

const app = express();

app.use(cors(
    {
        origin: FRONTEND_URL
    }
));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(parfumRoutes);
app.use(cartRoutes);
app.use(linksWhatsapp);

dotenv.config();
whatsapp.initialize();
app.listen(PORT || 4000);
console.log('Server levantado en el puerto', PORT || 4000)


// server {
//     listen: 80;
//     listen [::]:80;
//     server_name _;

//     location / {
//         proxy_pass http://localhost:3000;
//         proxy_http_version 1.1;
//         proxy_set_header Upgrade $http_upgrade;
//         proxy_set_header Connection 'upgrade';
//         proxy_set_header Host $host;
//         proxy_cache_bypass $http_upgrade;
//     }
// }