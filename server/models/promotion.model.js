import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    media: {
        type: String,
        required: function() { return this.status === '1'; }
    },
    status: {
        type: Number,
        required: true,
    }
}, {
    timestamps: true
})

export default mongoose.model('Promotion', promotionSchema)