import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    percentage: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
        required: true,
    }
}, {
    timestamps: true
})

export default mongoose.model('Coupon', couponSchema)