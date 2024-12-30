import { createAccessToken } from '../libs/jwt.js'
import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'

export const postUser = async(req, res) => {
    const { firstname, lastname, email, password } = req.body

    try {

        const passwordHash = await bcrypt.hash(password, 10)

        const newUser = new User({
            firstname,
            lastname,
            email,
            password: passwordHash
        });
    
        const userSaved = await newUser.save()
        const token = await createAccessToken({ id: userSaved._id })
        res.cookie("token", token)
        res.json({
            id: userSaved._id,
            firstname: userSaved.firstname,
            lastname: userSaved.lastname,
            email: userSaved.email,
            createdAt: userSaved.createdAt,
            updatedAt: userSaved.updatedAt
        })   
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const logIn = async(req, res) => {
    const { email, password } = req.body

    try {

        const userFound = await User.findOne({email})
        if (!userFound) return res.status(400).json({ message: "Invalid Credentials" })

        const isMatch = await bcrypt.compare(password, userFound.password)
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" })

        const token = await createAccessToken({ id: userFound._id })
    
        res.cookie("token", token)
        res.json({
            id: userFound._id,
            firstname: userFound.firstname,
            lastname: userFound.lastname,
            email: userFound.email,
            createdAt: userFound.createdAt,
            updatedAt: userFound.updatedAt
        })   
    } catch (error) {
        res.status(500).json({ message: error.message })
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
        createdAt: userFound.createdAt,
        updatedAt: userFound.updatedAt
    })
}