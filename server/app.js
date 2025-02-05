// app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { connectDB } from './db.js';
import { FRONTEND_URL, ADMIN_URL, FRONTEND_URL_DOMAIN_CERTIFICATE, FRONTEND_URL_DOMAIN_CERTIFICATE_WWW, FRONTEND_URL_LOCAL, ADMIN_URL_LOCAL, ADMIN_URL_DOMAIN_CERTIFICATE, ADMIN_URL_DOMAIN_CERTIFICATE_WWW } from './config.js';
import authRoutes from './routes/auth.routes.js';
import bodyRoutes from './routes/body.routes.js';
import brandRoutes from './routes/brand.routes.js';
import cartRoutes from './routes/cart.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import indexRoutes from './routes/index.routes.js';
import parfumRoutes from './routes/parfum.routes.js';
import promotionRoutes from './routes/promotion.routes.js';
import typeRoutes from './routes/type.routes.js';
import versionRoutes from './routes/version.routes.js';
import userRoutes from './routes/user.routes.js';
import imgRoutes from './routes/img.routes.js';
import transactionRoutes from './routes/transaction.routes.js';

dotenv.config();
connectDB();

export const app = express();

app.use(cors({
    origin: [FRONTEND_URL, ADMIN_URL, FRONTEND_URL_DOMAIN_CERTIFICATE, FRONTEND_URL_DOMAIN_CERTIFICATE_WWW, FRONTEND_URL_LOCAL, ADMIN_URL_LOCAL, ADMIN_URL_DOMAIN_CERTIFICATE, ADMIN_URL_DOMAIN_CERTIFICATE_WWW],
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rutas
app.use(authRoutes);
app.use(bodyRoutes);
app.use(brandRoutes);
app.use(cartRoutes);
app.use(couponRoutes);
app.use(indexRoutes);
app.use(parfumRoutes);
app.use(promotionRoutes);
app.use(typeRoutes);
app.use(versionRoutes);
app.use(userRoutes);
app.use(imgRoutes);
app.use(transactionRoutes);
