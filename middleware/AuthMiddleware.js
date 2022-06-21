import jwt from "jsonwebtoken";
import expressAsyncHandler from "express-async-handler";
import User from "../models/UserModel.js";

const protect = expressAsyncHandler(async (req, res, next) => {
    {
        let token;
        console.log(req.headers);
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer"))
            try {
                token = req.headers.authorization.split(" ")[1];
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                const userId = decoded.id || null;
                req.user = await User.findOne({ _id: userId, isDisabled: false }).select("-password");
                next();
            } catch (error) {
                console.error(`Error when protect auth middleware: ${error}`);
                res.status(401);
                throw new Error("Not authorized, token failed");
            }
        if (!token) {
            res.status(401);
            throw new Error("Not authorized, no token");
        }
    }
});

const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401);
        throw new Error("Not authorized as an Admin");
    }
};

const optional = expressAsyncHandler(async (req, res, next) => {
    {
        let token;
        console.log(req.headers);
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
            try {
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                const userId = decoded.id || null;
                req.user = await User.findOne({ _id: userId, isDisabled: false }).select("-password");
            } catch (error) {
                next();
            }
        }
        next();
    }
});

export { protect, admin, optional };
