import express from 'express';

import cors from 'cors'
import dotenv from 'dotenv';
import morgan from 'morgan';

import { PORT } from './config.js';
import { FRONTEND_URL, ADMIN_URL } from './config.js';
import { connectDB } from './db.js';

import authRoutes from './routes/auth.routes.js'
import cookieParser from 'cookie-parser';

import bodyRoutes from './routes/body.routes.js'
import brandRoutes from './routes/brand.routes.js'
import cartRoutes from './routes/cart.routes.js'
import indexRoutes from './routes/index.routes.js'
import parfumRoutes from './routes/parfum.routes.js'
import typeRoutes from './routes/type.routes.js'
import versionRoutes from './routes/version.routes.js'
import userRoutes from './routes/user.routes.js'
import imgRoutes from './routes/img.routes.js'



const app = express();

app.use(cors(
    {
        origin: [FRONTEND_URL, ADMIN_URL],
        credentials: true
    }
));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser())
app.use('/uploads', express.static('uploads'))
app.use(express.urlencoded({extended: false}));

dotenv.config();
connectDB();

app.use(authRoutes);
app.use(bodyRoutes);
app.use(brandRoutes);
app.use(cartRoutes);
app.use(indexRoutes);
app.use(parfumRoutes);
app.use(typeRoutes);
app.use(versionRoutes);
app.use(userRoutes);
app.use(imgRoutes);

app.listen(PORT || 4000);
console.log('Server levantado en el puerto', PORT || 4000)