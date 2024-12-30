import mongoose from "mongoose";

const imagesSchema = new mongoose.Schema({
    img: {
        type: String,
        required: true
    }

}, {
    timestamps: true
})

export default mongoose.model('Images', imagesSchema)