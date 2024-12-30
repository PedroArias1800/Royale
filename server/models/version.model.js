import mongoose from "mongoose";

const versionSchema = mongoose.Schema({
    version_name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
}, {
    timestamps: true
})

export default mongoose.model('Version', versionSchema)