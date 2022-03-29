import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "./../middleware/AuthMiddleware.js";
import generateToken from "../utils/generateToken.js";
import User from "../models/UserModel.js";

const userRouter = express.Router();


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
userRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const isExistingUser = User.find({ email });
    if (isExistingUser) {
      res.status(400);
      throw new Error("Email of user already exists");
    }
    //else
    const newUser = await User.create({
      name,
      email,
      password,
    });
    if (newUser) {
      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        token: generateToken(newUser._id),
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  })
);

/**
 * PROFILE
 */
userRouter.get(
  "/profile",
  protect,
  expressAsyncHandler(async (res, req) => {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createAt: user.createAt,
      });
    } else {
      res.status(400);
      throw new Error("User not Found");
    }
  })
);

/**
 * UPDATE PROFILE
 */
userRouter.put("/profile", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.express = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }
    const updateUser = await user.save();
    res.json({
      _id: updateUser._id,
      name: updateUser.name,
      email: updateUser.email,
      isAdmin: updateUser.isAdmin,
      createAt: updateUser.createAt,
      token: generateToken(updateUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not Found");
  }
});

/**
 * GET ALL USER by ADMIN
 */
userRouter.get(
  "/",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({});
    res.json(users);
  })
);

export default userRouter;
