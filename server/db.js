import mongoose from "mongoose"; 

export const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://admin_user:weMOOr1d4gtKQuvLUZPhAHaKIYnOYze9@93.188.162.15/royale', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    } catch (error) {
        console.error(error)
    }
}