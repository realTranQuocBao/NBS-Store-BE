import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/AuthMiddleware.js";
import generateToken from "../utils/generateToken.js";
import RefreshToken from "../models/RefreshTokenModel.js";
import User from "../models/UserModel.js";

const refreshTokenRouter = express.Router();

//get all refresh tokens (test-only api)
refreshTokenRouter.get(
    "/",
    expressAsyncHandler(async (req, res) => {
        const refreshTokens = await RefreshToken.find();
        res.status(200);
        res.json(refreshTokens);
    })
)

//user create new refresh token (test-only api)
refreshTokenRouter.post(
    "/",
    protect,
    expressAsyncHandler(async (req, res) => {
        const refreshToken = new RefreshToken({
            user: req.user._id,
            tokenValue: "this is parent refresh token",
        })
        await refreshToken.save();
        res.status(201);
        res.json(refreshToken);
    })
)

//user refresh access token
refreshTokenRouter.patch(
    "/refresh",
    protect,
    expressAsyncHandler(async (req, res) => {
        const refreshTokenSendByUser = req.body.refreshToken || null;
        const parentRefreshToken = await RefreshToken.findOne({ refreshTokenItems: refreshTokenSendByUser });
        console.log(parentRefreshToken);
        if (!parentRefreshToken) {
            res.status(404);
            throw new Error("Refresh token not found");
        }
        if (parentRefreshToken.refreshTokenItems.indexOf(refreshTokenSendByUser) != parentRefreshToken.refreshTokenItems.length - 1) {
            await RefreshToken.deleteOne({ _id: parentRefreshToken._id });
            res.status(401);
            throw new Error("Refresh token is expired, please login again");
        }
        const newAccessToken = generateToken(req.user._id, process.env.ACCESS_TOKEN_SECRET, process.env.ACCESS_TOKEN_EXPIRESIN);
        const newRefreshToken = generateToken(req.user._id, process.env.REFRESH_TOKEN_SECRET, process.env.REFRESH_TOKEN_EXPIRESIN);
        parentRefreshToken.refreshTokenItems.push(newRefreshToken);
        await parentRefreshToken.save();
        res.status(200);
        res.json({
            token: newAccessToken,
            refreshToken: newRefreshToken
        });
    })
)

export default refreshTokenRouter;