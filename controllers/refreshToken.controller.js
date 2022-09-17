import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/auth.middleware.js";
import generateToken from "../utils/generateToken.js";
import RefreshToken from "../models/refreshToken.model.js";
import User from "../models/user.model.js";

//get all refresh tokens (test-only api)
const getAllRefreshTokenForTest = async (req, res) => {
    const refreshTokens = await RefreshToken.find();
    res.status(200);
    res.json(refreshTokens);
};

//user create new refresh token (test-only api)
const createNewRefreshTokenForTest = async (req, res) => {
    const refreshToken = new RefreshToken({
        user: req.user._id,
        tokenValue: "this is parent refresh token"
    });
    await refreshToken.save();
    res.status(201);
    res.json(refreshToken);
};

//User refresh access token
const refreshAccessToken = async (req, res) => {
    const refreshTokenSendByUser = req.body.refreshToken || null;
    const parentRefreshToken = await RefreshToken.findOne({ refreshTokenItems: refreshTokenSendByUser });
    if (!parentRefreshToken) {
        res.status(404);
        throw new Error("Refresh token not found");
    }
    if (
        parentRefreshToken.refreshTokenItems.indexOf(refreshTokenSendByUser) !=
        parentRefreshToken.refreshTokenItems.length - 1
    ) {
        await RefreshToken.deleteOne({ _id: parentRefreshToken._id });
        res.status(401);
        throw new Error("Refresh token is expired, please login again");
    }
    const newAccessToken = generateToken(
        parentRefreshToken.user,
        process.env.ACCESS_TOKEN_SECRET,
        process.env.ACCESS_TOKEN_EXPIRESIN
    );
    const newRefreshToken = generateToken(
        parentRefreshToken.user,
        process.env.REFRESH_TOKEN_SECRET,
        process.env.REFRESH_TOKEN_EXPIRESIN
    );
    parentRefreshToken.refreshTokenItems.push(newRefreshToken);
    await parentRefreshToken.save();
    res.status(200);
    res.json({
        token: newAccessToken,
        refreshToken: newRefreshToken
    });
};

const RefreshTokenControler = {
    getAllRefreshTokenForTest,
    createNewRefreshTokenForTest,
    refreshAccessToken
};

export default RefreshTokenControler;
