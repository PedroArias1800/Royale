import mongoose from "mongoose"; 

export const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://93.188.162.15/royale')
    } catch (error) {
        console.error(error)
    }
}