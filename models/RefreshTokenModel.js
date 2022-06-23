import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const RefreshTokenSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        tokenValue: {
            type: String,
            required: true
        },
        refreshTokenItems: []
    },
    {
        timestamps: true
    }
);
RefreshTokenSchema.index({ updatedAt: 1 }, { expireAfterSeconds: Number(process.env.REFRESH_TOKEN_EXPIRESIN) / 1000 });
const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);
export default RefreshToken;
