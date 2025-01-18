import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from "../config.js";

export const createAccessToken = (payload, res) => {
    return new Promise((resolve, reject) => {
        jwt.sign(
            payload,
            TOKEN_SECRET,
            {
                expiresIn: "1d",
            },
            (err, token) => {
                if (err) reject(err);

                // Enviar la cookie con el token
                res.cookie('token', token, {
                    httpOnly: true,      // Impide el acceso por JavaScript
                    secure: process.env.NODE_ENV === 'production', // Asegura que solo se envíe por HTTPS en producción
                    sameSite: 'Strict',  // Mejora la seguridad contra CSRF
                    expires: new Date(Date.now() + 3600000), // 1 hora de expiración, ajusta según tus necesidades
                    path: '/'            // Asegura que esté disponible en todo el sitio
                });

                resolve(token); // Devolver el token para otras operaciones si es necesario
            }
        );
    });
};
