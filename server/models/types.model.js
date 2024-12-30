import mongoose from "mongoose";

const typesSchema = new mongoose.Schema({
    ml: {
        type: String,
        required: true,
    },
    img: {
        type: String,
        required: true,
    },
    price: {
        type: Float32Array,
        required: true,
    },
    old_price: {
        type: Float32Array,
        required: true,
    },
    status: {
        type: Float32Array,
        required: true,
    },
    parfum_id_fk: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parfum',
        required: true,
    },
}, {
    timestamps: true
})

export default mongoose.model('Types', typesSchema)