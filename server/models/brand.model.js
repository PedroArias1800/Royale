import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
    brand_name: {
        type: String,
        require: true,
        unique: true,
    }
}, {
    timestamps: true
})

export default mongoose.model('Brand', brandSchema);