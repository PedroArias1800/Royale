import mongoose from "mongoose";

const parfumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    gender: {
        type: Number,
        required: true,
    },
    status: {
        type: Number,
        required: true,
    },
    version_id_fk: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Version',
        required: true,
    },
    brand_id_fk: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true,
    }
}, {
    timestamps: true
})

export default mongoose.model('Parfum', parfumSchema)