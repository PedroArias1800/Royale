import { createAccessToken } from '../libs/jwt.js'
import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { TOKEN_SECRET } from '../config.js'

export const logIn = async(req, res) => {
    const { email, password } = req.body

    try {

        const userFound = await User.findOne({email})
        if (!userFound) return res.status(400).json(["Invalid Credentials"])

        const isMatch = await bcrypt.compare(password, userFound.password)
        if (!isMatch) return res.status(400).json(["Invalid Credentials"])

        const token = await createAccessToken({ id: userFound._id })
    
        res.cookie('token', token, {
            httpOnly: true,      // No accesible por JavaScript
            secure: process.env.NODE_ENV === 'production', // Solo en HTTPS en producción
            sameSite: 'Strict',  // Protección CSRF
            expires: new Date(Date.now() + 3600000), // Expira en 1 hora
            path: '/'            // Asegura que la cookie esté disponible en todo el sitio
        });
        res.json({
            id: userFound._id,
            firstname: userFound.firstname,
            lastname: userFound.lastname,
            email: userFound.email,
            rol: userFound.rol,
            status: userFound.status,
            createdAt: userFound.createdAt,
            updatedAt: userFound.updatedAt
        })   
    } catch (error) {
        res.status(500).json([error.message])
    }
}

export const logOut = async(req, res) => {
    res.cookie('token', "", {
        expires: new Date(0)
    })
    return res.sendStatus(200)
}

export const profile = async(req, res) => {
    const userFound = await User.findById(req.user.id)
    if (!userFound) return res.status(400).json({ message: "User not Found" })

    return res.json({
        id: userFound._id,
        firstname: userFound.firstname,
        lastname: userFound.lastname,
        email: userFound.email,
        rol: userFound.rol,
        status: userFound.status,
        createdAt: userFound.createdAt,
        updatedAt: userFound.updatedAt
    })
}

export const verifyToken = async (req, res) => {
    const { token } = req.cookies;
    if (!token) return res.status(401).json(["No token, authorization denied"]);

    try {
        const user = await new Promise((resolve, reject) => {
            jwt.verify(token, TOKEN_SECRET, (err, decoded) => {
                if (err) reject("Invalid token");
                resolve(decoded);
            });
        });

        const userFound = await User.findById(user.id);
        if (!userFound) return res.status(401).json(["User not found"]);

        return res.json({
            id: userFound._id,
            firstname: userFound.firstname,
            lastname: userFound.lastname,
            email: userFound.email,
            rol: userFound.rol,
            status: userFound.status,
        });
    } catch (error) {
        return res.status(401).json([error]);
    }
};