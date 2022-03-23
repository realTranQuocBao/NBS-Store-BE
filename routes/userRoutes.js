import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "./../middleware/AuthMiddleware.js";
import generateToken from "../utils/generateToken.js";
import User from "../models/UserModel.js";

const userRouter = express.Router();

/**
 * LOGIN
 */
userRouter.post(
  "/login",
  expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
        createdAt: user.createdAt,
      });
    } else {
      res.status(401);
      throw new Error("Invalid Email or Password");
    }
  })
);

/**
 * REGISTER
 */

/**
 * PROFILE
 */

/**
 * UPDATE PROFILE
 */

/**
 * GET ALL USER by ADMIN
 */

export default userRouter;
