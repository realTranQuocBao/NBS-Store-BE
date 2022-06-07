import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "./../middleware/AuthMiddleware.js";
import * as helpers from "../constants/helperFunctions.js";
import Comment from "../models/CommentModel.js";
import User from "../models/UserModel.js";
import Product from "../models/ProductModel.js";

const commentRouter = express.Router();

//user post comment
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
        throw new Error("Invalid user id");
      }
      if (!existedProduct) {
        res.status(400);
        throw new Error("Invalid product id");
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
        res.status(201);
        res.json(createdComment);
      }
    })
);

//non-user, user get comment replies
commentRouter.get(
  "/:parentCommentId/reply",
  expressAsyncHandler(async (req, res) => {
    const parentCommentId = req.params.parentCommentId || null
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

//user, admin delete comment
commentRouter.delete(
  "/:commentId",
  protect,
  expressAsyncHandler(async (req, res) => {
    const commentId = req.params.commentId || null
    const comment = await Comment.findOne({ _id: commentId, isDisabled: false });
    if (!comment) {
      res.status(404);
      throw new Error("Comment not found in deleteCommentById function");
    }
    if (req.user._id.toString() !== comment.user.toString() && !req.user.isAdmin) {
      res.status(400);
      throw new Error("User cannot delete other users comment");
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

//user, admin change comment content
commentRouter.patch(
  "/:commentId/content",
  protect,
  expressAsyncHandler(async (req, res) => {
    const commentId = req.params.commentId || null
    const comment = await Comment.findOne({ _id: commentId, isDisabled: false });
    if (!comment) {
      res.status(404);
      res.json("Comment not found");
    }  
    if (req.user._id.toString() !== comment.user.toString() && !req.user.isAdmin) {
      res.status(400);
      throw new Error("User cannot change other users comment");
    }
    comment.content = req.body.content;
    const updatedComment = await comment.save();
    res.status(200);
    res.json(updatedComment); 
  })
);

//user, admin disable comment
commentRouter.patch(
  "/:commentId/disable",
  protect,
  expressAsyncHandler(async (req, res) => {
    const commentId = req.params.commentId || null
    const comment = await Comment.findOne({ _id: commentId, isDisabled: false });    
    if (!comment) {
      res.json(404);
      throw new Error("Comment not found");
    }
    if (req.user._id.toString() !== comment.user.toString() && !req.user.isAdmin) {
      res.status(400);
      throw new Error("User cannot disable other users comment");
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

//user, admin restore comment
commentRouter.patch(
  "/:commentId/restore",
  protect,
  expressAsyncHandler(async (req, res) => {
    const commentId = req.params.commentId || null
    const comment = await Comment.findOne({ _id: commentId, isDisabled: true });    
    if (!comment) {
      res.status(404);
      throw new Error("Comment not found");
    }
    if (req.user._id.toString() !== comment.user.toString() && !req.user.isAdmin) {
      res.status(400);
      throw new Error("User cannot restore other users comment");
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
