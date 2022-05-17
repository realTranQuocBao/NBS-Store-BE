import mongoose from "mongoose";

const ProducerSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        code: {
            type: String,
            required: false,
            default: "",
        },
        keyword: {
            type: String,
            required: false,
            default: "",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        isDisabled: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Producer = mongoose.model("Producer", ProducerSchema);
export default Producer;