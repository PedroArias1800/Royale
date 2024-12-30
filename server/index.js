import express from 'express';

import { PORT } from './config.js';
import cors from 'cors'
import morgan from 'morgan';

import parfumRoutes from './routes/parfum.routes.js'
import cartRoutes from './routes/cart.routes.js'
import adminRoutes from './routes/admin.routes.js'
import authRoutes from './routes/auth.routes.js'
import brandRoutes from './routes/brand.routes.js'
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import { FRONTEND_URL } from './config.js';
import { connectDB } from './db.js';


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

app.use(parfumRoutes);
app.use(cartRoutes);
app.use(adminRoutes);
app.use(authRoutes);
app.use(brandRoutes);

dotenv.config();
connectDB();

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