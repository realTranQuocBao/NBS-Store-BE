import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "./../middleware/AuthMiddleware.js";
import generateToken from "../utils/generateToken.js";
import resize from "./../utils/resizeImage.js";
import User from "../models/UserModel.js";
import Order from "../models/OrderModel.js";
import { upload } from "./../middleware/UploadMiddleware.js";
import path from "path";
import fs from "fs";
const __dirname = path.resolve();

const userRouter = express.Router();

/**
 * LOGIN
 * SWAGGER SETUP: ok
 */
userRouter.post(
  "/login",
  expressAsyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email, isDisabled: false });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || "./images/user.png",
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
        createdAt: user.createdAt,
        isDisabled: user.isDisabled,
      });
    } else {
      res.status(401);
      throw new Error("Invalid Email or Password");
    }
  })
);

/**
 * REGISTER
 * SWAGGER SETUP: ok
 */
userRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const isExistingUser = await User.findOne({ email: email, isDisabled: false });
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
        avatarUrl: newUser.avatarUrl || "./images/user.png",
        isAdmin: newUser.isAdmin,
        isDisabled: newUser.isDisabled,
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
 * SWAGGER SETUP: no
 */
userRouter.get(
  "/profile",
  protect,
  expressAsyncHandler(async (req, res) => {
    const userId = req.user.id ? req.user.id : null;
    const user = await User.findOne({ _id: userId, isDisabled: false });
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || "./images/avatar/default.png",
        isAdmin: user.isAdmin,
        createAt: user.createAt,
        isDisabled: user.isDisabled,
      });
    } else {
      res.status(400);
      throw new Error("User not Found");
    }
  })
);

/**
 * UPDATE PROFILE
 * SWAGGER SETUP: no
 */
userRouter.put("/profile", protect, async (req, res) => {
  const userId = req.user.id ? req.user.id : null;
  const user = await User.findOne({ _id: userId, isDisabled: false });
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }
    const updateUser = await user.save();
    res.json({
      _id: updateUser._id,
      name: updateUser.name,
      email: updateUser.email,
      avatarUrl: user.avatarUrl || "./images/user.png",
      isAdmin: updateUser.isAdmin,
      createAt: updateUser.createAt,
      isDisabled: newUser.isDisabled,
      token: generateToken(updateUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not Found");
  }
});

/**
 * GET ALL USERS by ADMIN
 * SWAGGER SETUP: no
 */
userRouter.get(
  "/",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({ isDisabled: false });
    res.json(users);
  })
);

/**
 * GET ALL USERS by ADMIN
 * SWAGGER SETUP: no
 */
userRouter.post(
  "/CreateOrUpdateAvatar/:userId",
  protect,
  upload.single("file"),
  expressAsyncHandler(async (req, res) => {
    const userId = req.user.id ? req.user.id : null;
    const user = await User.findOne({ _id: userId, isDisabled: false });
    if (user.isAdmin && req.params.userId) {
      user = await User.findById(req.params.userId);
    }
    if (user) {
      //folder path to upload avatar
      const avatarPath = path.join(__dirname, "/public/images/avatar/");
      if (!req.file) {
        res.status(400);
        throw new Error("No provide an image");
      }
      //else
      const filename = await resize.save(avatarPath, req.file.buffer);
      // res.json(filename);

      const oldAvatar = user.avatarUrl;
      user.avatarUrl = `/images/avatar/${filename}`;
      const updateUser = await user.save();

      //delete old avatar
      if (oldAvatar != "/images/avatar/default.png") {
        fs.unlink(path.join(__dirname, "public", oldAvatar), (err) => {
          if (err) console.log("Delete old avatar have err:", err);
        });
      }

      res.json({
        _id: updateUser._id,
        name: updateUser.name,
        email: updateUser.email,
        avatarUrl: updateUser.avatarUrl,
        isAdmin: updateUser.isAdmin,
        token: generateToken(user._id),
        isDisabled: newUser.isDisabled,
        createAt: updateUser.createAt,
      });
    } else {
      res.status(400);
      throw new Error("User not Found");
    }
  })
);

//Admin disable user
userRouter.patch(
  "/:id/disable",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    } else {
      const order = await Order.findOne({ user: user._id, isDisabled: false });
      if (order) {
        res.status(400);
        throw new Error("Cannot disable user who had ordered");
      }
      else {
        user.isDisabled = req.body.isDisabled;
        await user.save();
        res.status(200);
        res.json({ message: "User has been disabled" });
      }
    }
  })
);

//Admin restore disabled user
userRouter.patch(
  "/:id/restore",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const userId = req.params.id ? req.params.id : null;
    const user = await Order.findOne({ _id: userId, isDisabled: true });
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    } else {
      user.isDisabled = req.body.isDisabled;
      const updateUser = await user.save();
      res.status(200);
      res.json(updateUser);
    }
  })
);


//Admin delete user
userRouter.delete(
  "/:id",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    } else {
      const order = await Order.findOne({ user: user._id, isDisabled: false });
      if (order) {
        res.status(400);
        throw new Error("Cannot delete user who had ordered");
      }
      else {
        await user.remove();
        res.status(200);
        res.json({ message: "User has been deleted"});
      }
    }
  })
);

export default userRouter;
