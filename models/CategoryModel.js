import mongoose from "mongoose";

const CategorySchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        slug: {
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
        status: {
            type: Boolean,
            required: false,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Category = mongoose.model("Category", CategorySchema);
export default Category;