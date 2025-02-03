import { createAccessToken } from '../libs/jwt.js'
import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { TOKEN_SECRET } from '../config.js'

const getRol = (id) => {
    try{
        if (id == 1){
            return 'Admin'
        } else if (id == 2){
            return 'Vendedor'
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "GetRol not Found" })
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const Users = await User.find().select('firstname lastname email rol status');
        res.json(Users);
    } catch (error) {
        console.log(error.message)
        res.status(500).send("Error al obtener los usuarios");
    }
};

export const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('firstname lastname email rol status')
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments();
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: users,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: total,
                itemsPerPage: limit,
            },
        });
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: 'Error al obtener los tipos' });
    }
};

export const postUser = async(req, res) => {
    try {
        const { firstname, lastname, email, password, rol, status } = req.body

        const userFound = await User.findOne({ email })
        if (userFound) return res.status(400).json(["El Correo ya está en uso"])

        const passwordHash = await bcrypt.hash(password, 10)

        const newUser = new User({
            firstname,
            lastname,
            email,
            password: passwordHash,
            rol,
            status
        });
    
        const userSaved = await newUser.save()
        const token = await createAccessToken({ id: userSaved._id })
        res.cookie('token', token, {
            httpOnly: true,
            domain: '.royalepanama.com',
            secure: true,      // Solo en producción con HTTPS
            sameSite: 'None',  // Permite cookies cross-site si es necesario
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 año de duración
            path: '/'
        });
        console.log(token)
        console.log(res.cookie)

        res.json({
            id: userSaved._id,
            firstname: userSaved.firstname,
            lastname: userSaved.lastname,
            email: userSaved.email,
            rol: getRol(userSaved.rol),
            status: userSaved.status,
            createdAt: userSaved.createdAt,
            updatedAt: userSaved.updatedAt
        })   
    } catch (error) {
        console.log(error.message)
        res.status(500).json([error.message])
    }
}

export const putUser = async(req, res) => {
    try {            
        const { firstname, lastname, email, password, rol, status } = req.body
    
        console.log(password)
        const passwordHash = await bcrypt.hash(password, 10)
        console.log(passwordHash)
        const putUser = new User({
            id: req.params.id,
            firstname,
            lastname,
            email,
            password: passwordHash,
            rol,
            status
        });
        
        const userUpdated = await User.findByIdAndUpdate(req.params.id, putUser, {
            new: true
        });

        res.json({
            id: userUpdated._id,
            firstname: userUpdated.firstname,
            lastname: userUpdated.lastname,
            email: userUpdated.email,
            rol: getRol(userUpdated.rol),
            status: userUpdated.status,
            createdAt: userUpdated.createdAt,
            updatedAt: userUpdated.updatedAt
        })   
    } catch (error) {
        console.log(error.message)
        res.status(500).json([error.message])
    }
}