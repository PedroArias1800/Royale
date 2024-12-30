import express from 'express';

import cors from 'cors'
import dotenv from 'dotenv';
import morgan from 'morgan';

import { PORT } from './config.js';
import { FRONTEND_URL } from './config.js';
import { connectDB } from './db.js';

import authRoutes from './routes/auth.routes.js'
import cookieParser from 'cookie-parser';

import bodyRoutes from './routes/body.routes.js'
import brandRoutes from './routes/brand.routes.js'
import cartRoutes from './routes/cart.routes.js'
import indexRoutes from './routes/index.routes.js'
import parfumRoutes from './routes/parfum.routes.js'
import versionRoutes from './routes/version.routes.js'



const app = express();

app.use(cors(
    {
        origin: FRONTEND_URL
    }
));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser())
app.use(express.urlencoded({extended: false}));

dotenv.config();
connectDB();

app.use(authRoutes);
app.use(bodyRoutes);
app.use(brandRoutes);
app.use(cartRoutes);
app.use(indexRoutes);
app.use(parfumRoutes);
app.use(versionRoutes);

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