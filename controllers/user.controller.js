import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/AuthMiddleware.js";
import generateToken from "../utils/generateToken.js";
import resize from "../utils/resizeImage.js";
import User from "../models/UserModel.js";
import Order from "../models/OrderModel.js";
import Cart from "../models/CartModel.js";
import Comment from "../models/CommentModel.js";
import { upload } from "../middleware/UploadMiddleware.js";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import RefreshToken from "../models/RefreshTokenModel.js";
import { userQueryParams, validateConstants } from "../constants/searchConstants.js";
import { sendMail } from "../utils/nodeMailler.js";
import { htmlMailVerify } from "../common/layoutMail.js";
import crypto from "crypto";
import { createVerifyToken } from "../utils/createVerifyToken.js";

const __dirname = path.resolve();

//User login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (await User.findOne({ email: email, isDisabled: false, isVerified: true })) {
    const user = await User.findOne({ email: email, isDisabled: false });
    if (user && (await user.matchPassword(password))) {
      //delete old refresh token if existed
      await RefreshToken.deleteMany({ user: user._id });
      //create new refresh token
      const tokenValue = generateToken(user._id, process.env.REFRESH_TOKEN_SECRET, process.env.REFRESH_TOKEN_EXPIRESIN);
      const newRefreshToken = await new RefreshToken({
        user: user._id,
        tokenValue: tokenValue,
        refreshTokenItems: [tokenValue]
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
        isDisabled: user.isDisabled
      });
    } else {
      res.status(401);
      throw new Error("Invalid Email or Password");
    }
  } else if (await User.findOne({ email: email, isDisabled: false, isVerified: false })) {
    res.status(401);
    throw new Error("Your account has not been verified. Please check your email inbox to verify.");
  } else {
    res.status(401);
    throw new Error("Account does not exist.");
  }
};

//Non-user register new account
const register = async (req, res, next) => {
  const { name, password } = req.body;
  const email = req.body.email.toString().toLowerCase();

  const isExistingUser = await User.findOne({ email });
  if (isExistingUser) {
    res.status(400);
    throw new Error("Email of user already exists");
  }
  //else
  const session = await mongoose.startSession();
  const transactionOptions = {
    readPreference: "primary",
    readConcern: { level: "local" },
    writeConcern: { w: "majority" }
  };

  const emailVerificationToken = createVerifyToken();
  const currentTime = new Date();

  try {
    await session.withTransaction(async () => {
      let newUser = await User.create(
        [
          {
            name,
            email,
            password,
            emailVerificationToken,
            verifyTokenCreateAt: currentTime
          }
        ],
        session
      );
      if (!newUser) {
        res.status(400);
        await session.abortTransaction();
        throw new Error("Invalid user data");
      }
      newUser = newUser[0];
      //create new refresh token
      const tokenValue = generateToken(
        newUser._id,
        process.env.REFRESH_TOKEN_SECRET,
        process.env.REFRESH_TOKEN_EXPIRESIN
      );
      const newRefreshToken = await new RefreshToken({
        user: newUser._id,
        tokenValue: tokenValue,
        refreshTokenItems: [tokenValue]
      }).save();

      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatarUrl: newUser.avatarUrl || "./images/user.png",
        isAdmin: newUser.isAdmin,
        isDisabled: newUser.isDisabled,
        token: generateToken(newUser._id, process.env.ACCESS_TOKEN_SECRET, process.env.ACCESS_TOKEN_EXPIRESIN),
        refreshToken: newRefreshToken.tokenValue
      });

      // Send email verify
      const html = htmlMailVerify(emailVerificationToken);
      const messageOptions = {
        recipient: newUser.email,
        subject: "NBS Store | User Registration Verification Code ",
        html: html
      };
      try {
        await sendMail(messageOptions);
        res.status(200);
        res.json({ message: "Sending verification mail successfully" });
      } catch (error) {
        next(error);
      }

      // Create cart for user
      const newCart = await Cart.create(
        [
          {
            user: newUser._id,
            cartItems: []
          }
        ],
        session
      );
      if (!newCart) {
        res.status(500);
        await session.abortTransaction();
        throw new Error("Failed to create user cart");
      }
    }, transactionOptions);
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  const emailVerificationToken = req.query?.emailVerificationToken.toString().trim();
  if (!emailVerificationToken || emailVerificationToken === "") {
    res.status(400);
    throw new Error("Token is not valid");
  }
  const user = await User.findOne({
    emailVerificationToken,
    isVerified: false
  });
  if (!user) {
    res.status(400);
    throw new Error("The email verification token is not valid or incorrect");
  }

  const currentTime = new Date();
  const tokenCreateTime = new Date(user.verifyTokenCreateAt);

  const timeDiffInMinutes = Math.floor((currentTime - tokenCreateTime) / (1000 * 60));

  let sendEmailMessageError = false;
  let statusVerify = false;

  // Check if the token is still valid (10 minutes in this example)
  if (timeDiffInMinutes <= 120) {
    // The token is valid, proceed with the verification process
    user.isVerified = true;
    user.emailVerificationToken = null;

    statusVerify = "Success";
  } else {
    // The token is invalid or has expired, show an error message
    statusVerify = "Expired";

    const emailVerificationToken = createVerifyToken();
    user.emailVerificationToken = emailVerificationToken;
    user.verifyTokenCreateAt = new Date();
    // Send email verify
    const html = htmlMailVerify(emailVerificationToken);
    const messageOptions = {
      recipient: user.email,
      subject: "NBS Store | User Registration Verification Code ",
      html: html
    };
    try {
      await sendMail(messageOptions);
    } catch (error) {
      sendEmailMessageError = error;
    }
  }

  const verifiedUser = await user.save();
  if (!verifiedUser) {
    res.status(500);
    throw new Error("Account verification failed");
  }
  res.status(200);

  if (statusVerify === "Expired") {
    res.json({
      sendEmailMessageError,
      statusVerify
    });
  } else {
    res.json({
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      sendEmailMessageError,
      statusVerify
    });
  }
};

// cancel verify email
const cancelVerifyEmail = async (req, res) => {
  const emailVerificationToken = req.query?.emailVerificationToken?.toString().trim() || null;
  if (!emailVerificationToken || emailVerificationToken === "") {
    res.status(400);
    throw new Error("Token is not valid");
  }
  const user = await User.findOneAndDelete({
    emailVerificationToken,
    isVerified: false
  });
  if (!user) {
    res.status(400);
    throw new Error("The email verification token is not valid or incorrect");
  }

  res.status(200);
  res.json("Email verification has been cancelled successfully");
};

//User get profile
const getProfile = async (req, res) => {
  res.status(200);
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    avatarUrl: req.user.avatarUrl || "./images/avatar/default.png",
    isAdmin: req.user.isAdmin,
    createAt: req.user.createAt,
    isDisabled: req.user.isDisabled
  });
};

//User update profile
const updateProfile = async (req, res) => {
  const user = req.user;
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  if (req.body.password) {
    user.password = req.body.password;
  }
  const updatedUser = await user.save();
  res.status(200);
  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    avatarUrl: updatedUser.avatarUrl || "./images/user.png",
    isAdmin: updatedUser.isAdmin,
    createAt: updatedUser.createAt,
    isDisabled: updatedUser.isDisabled,
    token: generateToken(updatedUser._id, process.env.ACCESS_TOKEN_SECRET, process.env.ACCESS_TOKEN_EXPIRESIN)
  });
};

// userRouter.get(
//     "/",
//     protect,
//     admin,
//     expressAsyncHandler(async (req, res) => {
//         const dateOrderFilter = validateConstants(userQueryParams, "date", req.query.dateOrder);
//         const statusFilter = validateConstants(userQueryParams, "status", req.query.status);
//         const users = await User.find({ ...statusFilter })
//             .sort({ ...dateOrderFilter })
//             .select("-password");
//         res.status(200);
//         res.json(users);
//     })
// );

//Admin get users
const getUsers = async (req, res) => {
  const dateOrderFilter = validateConstants(userQueryParams, "date", req.query.dateOrder);
  const statusFilter = validateConstants(userQueryParams, "status", req.query.status);
  const users = await User.find({ ...statusFilter }).sort({ ...dateOrderFilter });
  res.status(200);
  res.json(users);
};

// /**
//  * GET ALL USERS by ADMIN
//  * SWAGGER SETUP: no
//  */
// userRouter.get(
//     "/",
//     protect,
//     admin,
//     expressAsyncHandler(async (req, res) => {
//         const users = await User.find({ isDisabled: false }).select({ cart: 0 });
//         res.status(200);
//         res.json(users);
//     })
// );

// //Admin get all disabled users
// userRouter.get(
//     "/disabled",
//     protect,
//     admin,
//     expressAsyncHandler(async (req, res) => {
//         const users = await User.find({ isDisabled: true }).select({ cart: 0 });
//         if (users.length != 0) {
//             res.status(200);
//             res.json(users);
//         } else {
//             res.status(204);
//             res.json({ message: "No users are disabled" });
//         }
//     })
// );

//User upload avatar
const uploadAvatar = async (req, res) => {
  // const userId = req.user._id ? req.user._id : null;
  console.log(req.user._id.toString(), req.params.userId);
  let user = await User.findOne({
    _id: req.user._id,
    isDisabled: false
  });
  console.log("userLog", mongoose.isValidObjectId(req.params.userId));
  if (user.isAdmin && mongoose.isValidObjectId(req.params.userId)) {
    user = await User.findById(req.params.userId);
  }
  console.log("userLog2", user);
  if (!user) {
    res.status(400);
    throw new Error("User not Found");
  }
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
    createAt: updateUser.createAt
  });
};

//Admin disable user
const disableUser = async (req, res) => {
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
  // const disabledUser = await User.findOneAndUpdate({ _id: user._id }, { isDisabled: true }, { new: true });
  // //disable user comments
  // await Comment.updateMany({ isDisabled: false, user: disabledUser._id }, { $set: { isDisabled: true } });
  // //disable user replies
  // await Comment.updateMany(
  //     {},
  //     { $set: { "replies.$[element].isDisabled": true } },
  //     { arrayFilters: [{ "element.isDisabled": false, "element.user": disabledUser._id }] }
  // );
  res.status(200);
  res.json(disabledUser);
};

//Admin restore disabled user
const restoreUser = async (req, res) => {
  const userId = req.params.id || null;
  const user = await User.findOne({ _id: userId, isDisabled: true });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  // const duplicatedUser = await User.findOne({
  //     name: user.name,
  //     isDisabled: false
  // });
  // if (duplicatedUser) {
  //     res.status(400);
  //     throw new Error("Restore this user will result in duplicated user name");
  // }
  const restoredUser = await User.findOneAndUpdate({ _id: user._id }, { isDisabled: false }, { new: true });
  //.
  //restore comments
  // const comments = await Comment.find({
  //     $or: [
  //         { $and: [{ user: restoredUser._id }, { isDisabled: true }] },
  //         { replies: { $elemMatch: { user: restoredUser._id, isDisabled: true } } }
  //     ]
  // }).populate("user product replies.user replies.product");
  // for (const comment of comments) {
  //     if (comment.user._id.toString() === restoredUser._id.toString() && comment.isDisabled == true) {
  //         comment.isDisabled = comment.user.isDisabled || comment.product.isDisabled || false;
  //     }
  //     for (const reply of comment.replies) {
  //         if (reply.user._id.toString() === restoredUser._id.toString() && reply.isDisabled == true) {
  //             reply.isDisabled = reply.user.isDisabled || reply.product.isDisabled || false;
  //         }
  //     }
  //     await comment.save();
  // }
  res.status(200);
  res.json(restoredUser);
};

//Admin delete user
const deleteUser = async (req, res, next) => {
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
    writeConcern: { w: "majority" }
  };
  try {
    await session.withTransaction(async () => {
      const deletedUser = await User.findOneAndDelete({
        _id: user._id
      }).session(session);
      if (!deletedUser) {
        await session.abortTransaction();
        throw new Error("Something wrong while deleting user");
      }
      //delete refresh tokens
      const deletedRefreshToken = await RefreshToken.findOneAndDelete({
        user: user._id
      }).session(session);
      if (!deletedRefreshToken) {
        await session.abortTransaction();
        throw new Error("Something wrong while deleting refresh token");
      }
      //delete cart
      const deletedCart = await Cart.findOneAndDelete({
        user: deletedUser._id
      }).session(session);
      if (!deletedCart) {
        await session.abortTransaction();
        throw new Error("Something wrong while deleting user cart");
      }
      //delete comments
      const deletedComments = await Comment.deleteMany({
        user: deletedUser._id
      }).session(session);
      res.status(200);
      res.json({ message: "User has been deleted" });
    }, transactionOptions);
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

const UserControler = {
  login,
  register,
  verifyEmail,
  cancelVerifyEmail,
  getProfile,
  updateProfile,
  getUsers,
  uploadAvatar,
  disableUser,
  restoreUser,
  deleteUser
};

export default UserControler;
