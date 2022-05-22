import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "./../middleware/AuthMiddleware.js";
import * as helpers from "../constants/helperFunctions.js";
import Comment from "../models/CommentModel.js";
import User from "../models/UserModel.js";
import Product from "../models/ProductModel.js";

const commentRouter = express.Router();

commentRouter.post(
    "/",
    protect,
    expressAsyncHandler(async (req, res) => {
      const { productId, content, parentCommentId } = req.body;
      const userId = req.user._id;
      const findUser = User.findById(userId);
      const findProduct = Product.findById(productId);
      const [existedUser, existedProduct] = await Promise.all([findUser, findProduct]);
      if (!existedUser) {
        res.status(400);
        throw new Error("User not found");
      }
      if (!existedProduct) {
        res.status(400);
        throw new Error("Product not found");
      }
      let existedParentComment;
      if (parentCommentId) {
        existedParentComment = await Comment.findById(parentCommentId);
        if (!existedParentComment) {
          res.status(400);
          throw new Error("Parent comment not found");
        }
      }
      const comment = new Comment({
        user: userId,
        product: productId, 
        content,
        parentComment: parentCommentId,
      });
      if (!comment) {
        res.status(400);
        res.json("Invalid comment data");
      }
      else {
        const createdComment = await comment.save();
        if (existedParentComment) {
          existedParentComment.replies.push(createdComment._id);
          existedParentComment.save();
          //res.status(200);
          //res.json(existedParentComment);
        }
        res.status(200);
        res.json(createdComment);
      }
    })
);

commentRouter.get(
  "/:productId",
  expressAsyncHandler(async (req, res) => { 
    const product = await Product.findOne({ _id: req.params.productId, isDisabled: false });
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    const comments = await Comment.find({ product: product._id, parentComment: undefined, isDisabled: false });
    res.status(200);
    res.json(comments);
  })
);

commentRouter.get(
  "/:parentCommentId/reply",
  expressAsyncHandler(async (req, res) => {
    const parentCommentId = req.params.parentCommentId ? req.params.parentCommentId : null
    const parentComment = await Comment.findOne({ _id: parentCommentId, isDisabled: false });
    if (!parentComment) {
      res.status(404);
      throw new Error("Comment not found");
    }
    const replies = await Comment.find({ parentComment: parentComment._id, isDisabled: false }).populate("replies");
    res.status(200);
    res.json(replies);
  })
);

commentRouter.delete(
  "/:commentId",
  expressAsyncHandler(async (req, res) => {
    const commentId = req.params.commentId ? req.params.commentId : null
    const comment = await Comment.findOne({ _id: commentId, isDisabled: false });
    if (!comment) {
      throw new Error("Comment not found in deleteCommentById function");
    }
    let deletedComment;
    if (!comment.parentComment) {
      deletedComment = await helpers.deleteCommentById(commentId);
    }
    else {
      deletedComment = await helpers.deleteReplyById(commentId);
    }
    if (!deletedComment) {
      res.status(500);
      throw new Error("Delete failed");
    }
    res.status(200);
    res.json(deletedComment);
  })
)

commentRouter.patch(
  "/:commentId/content",
  protect,
  expressAsyncHandler(async (req, res) => {
    const commentId = req.params.commentId ? req.params.commentId : null
    const comment = await Comment.findOne({ _id: commentId, isDisabled: false });
    const { content } = req.body;
    if (!comment) {
      res.status(404);
      res.json("Comment not found");
    }  
    comment.content = content;
    const updatedComment = await comment.save();
    res.status(200);
    res.json(updatedComment); 
  })
);

commentRouter.patch(
  "/:commentId/disable",
  expressAsyncHandler(async (req, res) => {
    const commentId = req.params.commentId ? req.params.commentId : null
    const comment = await Comment.findOne({ _id: commentId, isDisabled: false });    
    if (!comment) {
      throw new Error("Comment not found");
    }
    const disabledComment = await Comment.findByIdAndUpdate(commentId, { isDisabled: true }, { new: true });
    if (!disabledComment) {
      res.status(500);
      throw new Error("Disable failed");
    }
    res.status(200);
    res.json(disabledComment);
  })
)

commentRouter.patch(
  "/:commentId/restore",
  expressAsyncHandler(async (req, res) => {
    const commentId = req.params.commentId ? req.params.commentId : null
    const comment = await Comment.findOne({ _id: commentId, isDisabled: true });    
    if (!comment) {
      throw new Error("Comment not found");
    }
    const restoredComment =  await Comment.findByIdAndUpdate(commentId, { isDisabled: false }, { new: true });
    if (!restoredComment) {
      res.status(500);
      throw new Error("Restore failed");
    }
    res.status(200);
    res.json(restoredComment);
  })
)

export default commentRouter;
