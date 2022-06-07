import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "./../middleware/AuthMiddleware.js";
import generateToken from "../utils/generateToken.js";
import resize from "./../utils/resizeImage.js";
import User from "../models/UserModel.js";
import Order from "../models/OrderModel.js";
import Cart from "../models/CartModel.js";
import Comment from "../models/CommentModel.js";
import { upload } from "./../middleware/UploadMiddleware.js";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import Product from "../models/ProductModel.js";
import RefreshToken from "../models/RefreshTokenModel.js";
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
      //delete old refresh token if existed
      await RefreshToken.deleteMany({ user: user._id })
      //create new refresh token
      const tokenValue = generateToken(user._id, process.env.REFRESH_TOKEN_SECRET, process.env.REFRESH_TOKEN_EXPIRESIN);
      const newRefreshToken = await new RefreshToken({
        user: user._id,
        tokenValue: tokenValue,
        refreshTokenItems: [tokenValue],
      }).save();
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || "./images/user.png",
        isAdmin: user.isAdmin,
        token: generateToken(user._id, process.env.ACCESS_TOKEN_SECRET, process.env.ACCESS_TOKEN_EXPIRESIN),
        refreshToken: newRefreshToken.tokenValue,
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
  expressAsyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;
    const isExistingUser = await User.findOne({
      email: email,
      isDisabled: false,
    });
    if (isExistingUser) {
      res.status(400);
      throw new Error("Email of user already exists");
    }
    //else
    const session = await mongoose.startSession();
    const transactionOptions = {
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' },
    };
    try {
      await session.withTransaction(async () => {
        const newUser = await User.create([{
          name,
          email,
          password,
        }], session);
        if (!newUser) {
          res.status(400);
          await session.abortTransaction();
          throw new Error("Invalid user data");
        }
        //create new refresh token
        const tokenValue = generateToken(newUser._id, process.env.REFRESH_TOKEN_SECRET, process.env.REFRESH_TOKEN_EXPIRESIN);
        const newRefreshToken = await new RefreshToken({
          user: newUser._id,
          tokenValue: tokenValue,
          refreshTokenItems: [tokenValue],
        }).save();
        const newCart = await Cart.create([{
          user: newUser._id,
          cartItems: [],
        }], session);
        if (!newCart) {
          //Note: không biết trả về status với error gì cho hợp lý.
          res.status(500);
          await session.abortTransaction();
          throw new Error("Failed to create user cart");
        } 
        res.status(201).json({
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          avatarUrl: newUser.avatarUrl || "./images/user.png",
          isAdmin: newUser.isAdmin,
          isDisabled: newUser.isDisabled,
          token: generateToken(newUser._id, process.env.ACCESS_TOKEN_SECRET, process.env.ACCESS_TOKEN_EXPIRESIN),
          refreshToken: newRefreshToken.tokenValue,
        });
      }, transactionOptions);
    }
    catch (error) {
      next(error);
    }
    finally {
      await session.endSession();
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
    const userId = req.user._id || null;
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
  const userId = req.user._id || null;
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
      avatarUrl: updateUser.avatarUrl || "./images/user.png",
      isAdmin: updateUser.isAdmin,
      createAt: updateUser.createAt,
      isDisabled: updateUser.isDisabled,
      token: generateToken(updateUser._id, process.env.ACCESS_TOKEN_SECRET, process.env.ACCESS_TOKEN_EXPIRESIN),
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
    const users = await User.find({ isDisabled: false }).select({ cart: 0 });
    res.json(users);
  })
);

//Admin get all disabled users
userRouter.get(
  "/disabled",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({ isDisabled: true }).select({ cart: 0 });
    if (users.length != 0) {
      res.status(200);
      res.json(users);
    } else {
      res.status(204);
      res.json({ message: "No users are disabled" });
    }
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
    // const userId = req.user._id ? req.user._id : null;
    console.log(req.user._id.toString(), req.params.userId);
    let user = await User.findOne({
      _id: req.user._id,
      isDisabled: false,
    });
    console.log("userLog", mongoose.isValidObjectId(req.params.userId));
    if (user.isAdmin && mongoose.isValidObjectId(req.params.userId)) {
      user = await User.findById(req.params.userId);
    }
    console.log("userLog2", user);
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
        token: generateToken(updateUser._id, process.env.ACCESS_TOKEN_SECRET, process.env.ACCESS_TOKEN_EXPIRESIN),
        isDisabled: updateUser.isDisabled,
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
    const userId = req.params.id || null;
    const user = await User.findOne({ _id: userId, isDisabled: false });
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    const order = await Order.findOne({ user: user._id, isDisabled: false });
    if (order) {
      res.status(400);
      throw new Error("Cannot disable user who had ordered");
    }
    user.isDisabled = true;
    const disabledUser = await user.save();
    //disable comments
    await Comment.updateMany({ user: disabledUser }, { isDisabled: true });
    res.status(200);
    res.json({ message: "User has been disabled" });
  })
);

//Admin restore disabled user
userRouter.patch(
  "/:id/restore",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const userId = req.params.id || null;
    const user = await User.findOne({ _id: userId, isDisabled: true });
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    const duplicatedUser = await User.findOne({
      name: user.name,
      isDisabled: false,
    });
    if (duplicatedUser) {
      res.status(400);
      throw new Error("Restore this user will result in duplicated user name");
    }
    user.isDisabled = false;
    const restoredUser = await user.save();
    //.
    //restore comments
    const userComments = await Comment.find({
      user: restoredUser._id,
      isDisabled: true,
    });
    for (const comment of userComments) {
      const linkedProduct = await Product.findById(comment.product);
      if (linkedProduct.isDisabled == false) {
        comment.isDisabled = false;
        comment.save();
      }
    }
    res.status(200);
    res.json(restoredUser);
  })
);

//Admin delete user
userRouter.delete(
  "/:id",
  protect,
  admin,
  expressAsyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    const order = await Order.findOne({ user: user._id, isDisabled: false });
    if (order) {
      res.status(400);
      throw new Error("Cannot delete user who had ordered");
    }
    const session = await mongoose.startSession();
    const transactionOptions = {
      readPreference: "primary",
      readConcern: { level: "local" },
      writeConcern: { w: "majority" },
    };
    try {
      await session.withTransaction(async () => {
        const deletedUser = await User.findOneAndDelete({
          _id: user._id,
        }).session(session);
        if (!deletedUser) {
          await session.abortTransaction();
          throw new Error("Something wrong while deleting user");
        }
        //delete cart
        const deletedCart = await Cart.findOneAndDelete({
          user: deletedUser._id,
        }).session(session);
        if (!deletedCart) {
          await session.abortTransaction();
          throw new Error("Something wrong while deleting user cart");
        }
        //delete comments
        const deletedComments = await Comment.deleteMany({
          user: deletedUser._id,
        }).session(session);
        res.status(200);
        res.json({ message: "User has been deleted" });
      }, transactionOptions);
    } catch (error) {
      next(error);
    } finally {
      await session.endSession();
    }
  })
);

export default userRouter;
