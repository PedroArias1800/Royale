import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    direction: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        require: true,
        trim: true,
    },
    subTotal: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: Boolean,
        default: false
    },
    products: {
        type: [String],
        require: true,
    },
    productsTypes: {
        type: [String],
        require: true,
    },
    quantities: {
        type: [Number],
        require: true,
    },
}, {
    timestamps: true
})

export default mongoose.model('Transaction', transactionSchema)