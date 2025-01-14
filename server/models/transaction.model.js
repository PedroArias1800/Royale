import mongoose from "mongoose";
import { notifyAdmins } from '../socket.js'

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
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parfum' }],
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

transactionSchema.post('save', function (doc) {
    if (!doc.status) {
      notifyAdmins(doc);
    }
  });

export default mongoose.model('Transaction', transactionSchema)