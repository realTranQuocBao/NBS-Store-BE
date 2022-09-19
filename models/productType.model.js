import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const productType = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        avatarUrl: {
            type: String,
            required: false,
            default: "/images/avatar/default.png"
        },
        isAdmin: {
            type: Boolean,
            required: true,
            default: false
        },
        isDisabled: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const ProductType = mongoose.model("ProductType", productType);

export default ProductType;
