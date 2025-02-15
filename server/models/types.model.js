import mongoose from "mongoose";

const typesSchema = new mongoose.Schema({
    ml: {
        type: String,
        required: true,
    },
    img: {
        type: String,
        required: function() { return this.status === '1'; }
    },
    cost: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    status: {
        type: Number,
        required: true,
    },
    type_of_sale:{
        type: String,
        required: true,
    },
    price_flash:{
        type: Number,
        required: true,
    },
    quantity_flash:{
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

export default mongoose.model('Types', typesSchema)