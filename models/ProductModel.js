import mongoose from "mongoose";
// import Category from "./Category";

const reviewSchema = mongoose.Schema(
    {
        rating: {
            type: Number,
            required: true
        },
        reviewContent: {
            type: String,
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

const commentSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        comment: {
            type: String,
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

const productSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        image: {
            type: String
        },
        description: {
            type: String,
            required: true
        },
        reviews: [reviewSchema],
        category: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Category"
        },
        // category: { Category },
        rating: {
            type: Number,
            required: true,
            default: 0
        },
        numReviews: {
            type: Number,
            required: true,
            default: 0
        },
        price: {
            type: Number,
            required: true,
            default: 0
        },
        countInStock: {
            type: Number,
            required: true,
            default: 0
        },
        totalSales: {
            type: Number,
            required: true,
            default: 0
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

const Product = mongoose.model("Product", productSchema);

export default Product;
