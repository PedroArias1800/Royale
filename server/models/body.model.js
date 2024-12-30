import mongoose from "mongoose";

const bodySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    align: {
        type: String,
        required: true,
    },
    parfum_img: {
        type: String,
        required: true,
    },
    back_img: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    color2: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
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

export default mongoose.model('Body', bodySchema)