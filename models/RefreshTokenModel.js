import mongoose from "mongoose";

const RefreshTokenSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        tokenValue: {
            type: String,
            required: true,
        },
        refreshTokenItems: [],
    },
    {
        timestamps: true,
    }
);

RefreshTokenSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 5400 });
const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);
export default RefreshToken;