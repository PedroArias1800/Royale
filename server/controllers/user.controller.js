import { createAccessToken } from '../libs/jwt.js'
import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { TOKEN_SECRET } from '../config.js'

const getRol = (id) => {
    if (id == 1){
        return 'Admin'
    } else if (id == 2){
        return 'Vendedor'
    }
}

export const getAllUsers = async (req, res) => {
    try {
        const Users = await User.find().select('firstname lastname email rol status');
        res.json(Users);
    } catch (error) {
        console.error("Error al obtener los usuarios:", error);
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
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los tipos' });
    }
};

export const postUser = async(req, res) => {
    const { firstname, lastname, email, password, rol, status } = req.body

    try {

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
        res.cookie("token", token)
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
        res.status(500).json([error.message])
    }
}

export const putUser = async(req, res) => {
    const { firstname, lastname, email, password, rol, status } = req.body
    
    try {            
        console.log(password)
        const passwordHash = await bcrypt.hash(password, 10)
        console.log(password)
        const putUser = new User({
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
        res.status(500).json([error.message])
    }
}