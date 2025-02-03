import { createAccessToken } from '../libs/jwt.js'
import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { TOKEN_SECRET } from '../config.js'

export const logIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userFound = await User.findOne({ email });
        if (!userFound) return res.status(400).json(["Invalid Credentials"]);

        const isMatch = await bcrypt.compare(password, userFound.password);
        if (!isMatch) return res.status(400).json(["Invalid Credentials"]);

        const token = await createAccessToken({ id: userFound._id });

        res.cookie('token', token, {
            httpOnly: true,
            domain: 'admin.royalepanama.com',
            secure: true,      // Solo en producción con HTTPS
            sameSite: 'None',  // Permite cookies cross-site si es necesario
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 año de duración
            path: '/'
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
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json([error.message]);
    }
};


export const logOut = async(req, res) => {
    try{
        res.cookie('token', "", {
            expires: new Date(0)
        })
        return res.sendStatus(200)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "LogOut not Found" })
    }
}

export const profile = async(req, res) => {
    try{
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
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Profile not Found" })
    }
}

export const verifyToken = async (req, res) => {
    try {
        const { token } = req.cookies;
        console.log(token)
        if (!token) return res.status(401).json(["No token, authorization denied"]);

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
        console.log(error.message)
        return res.status(401).json([error]);
    }
};