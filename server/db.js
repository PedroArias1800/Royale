import mongoose from "mongoose"; 

export const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://93.188.162.15:27017/royale', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    } catch (error) {
        console.error(error)
    }
}