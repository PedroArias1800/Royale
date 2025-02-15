export const PORT = 4001

export const FRONTEND_URL = process.env.FRONTEND_URL || "http://93.188.162.15:5173";
export const FRONTEND_URL_LOCAL = process.env.FRONTEND_URL_LOCAL || "https://royalepanama.com";
export const FRONTEND_URL_DOMAIN_CERTIFICATE = process.env.FRONTEND_URL_DOMAIN_CERTIFICATE || "https://royalepanama.com";
export const FRONTEND_URL_DOMAIN_CERTIFICATE_WWW = process.env.FRONTEND_URL_DOMAIN_CERTIFICATE_WWW || "https://www.royalepanama.com";
export const ADMIN_URL = process.env.ADMIN_URL || "http://93.188.162.15:5174";
export const ADMIN_URL_LOCAL = process.env.ADMIN_URL_LOCAL || "https://admin.royalepanama.com";
export const ADMIN_URL_DOMAIN_CERTIFICATE = process.env.ADMIN_URL_DOMAIN_CERTIFICATE || "https://admin.royalepanama.com";
export const ADMIN_URL_DOMAIN_CERTIFICATE_WWW = process.env.ADMIN_URL_DOMAIN_CERTIFICATE_WWW || "https://www.admin.royalepanama.com";

export const DB_HOST = process.env.DB_HOST || 'dpg-ctkseglds78s73c2disg-a';
export const DB_PORT = process.env.DB_PORT || '5432';
export const DB_DATABASE = process.env.DB_DATABASE || 'royale';
export const DB_USER = process.env.DB_USER || 'royale_user';
export const DB_PASSWORD = process.env.DB_PASSWORD || 'weMOOr1d4gtKQuvLUZPhAHaKIYnOYze9';

export const TOKEN_SECRET = 'some secret key'