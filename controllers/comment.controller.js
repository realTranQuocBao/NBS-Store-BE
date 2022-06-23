import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/AuthMiddleware.js";
import * as helpers from "../constants/helperFunctions.js";
import Comment from "../models/CommentModel.js";
import User from "../models/UserModel.js";
import Product from "../models/ProductModel.js";
import { commentQueryParams, validateConstants } from "../constants/searchConstants.js";

//user post comment
const createComment = async (req, res) => {
    const productId = req.body.productId || null;
    const content = req.body.content;
    const parentCommentId = req.body.parentCommentId;
    //check if comment is valid
    const existedProduct = await Product.findOne({ _id: productId, isDisabled: false });
    if (!existedProduct) {
        res.status(400);
        throw new Error("Invalid product id");
    }
    //create new comment
    let savedComment;
    const comment = new Comment({
        user: req.user._id,
        product: productId,
        content,
        parentComment: parentCommentId
    });
    //check if comment data is valid
    if (!comment) {
        res.status(400);
        res.json("Invalid comment data");
    }
    //check if parent comment id is provided
    if (parentCommentId != null) {
        let existedParentComment = await Comment.findOne({
            $and: [{ $or: [{ _id: parentCommentId }, { "replies._id": parentCommentId }] }, { isDisabled: false }]
        });
        // if new comment is a reply, then push it into parent comment replies array
        if (existedParentComment != null) {
            if (existedParentComment.product.toString() !== comment.product.toString()) {
                res.status(400);
                throw new Error("Parent comment and reply must link to the same product");
            }
            comment.parentComment = existedParentComment._id;
            existedParentComment.replies.push(comment);
            savedComment = await existedParentComment.save();
            res.status(200);
        }
    }
    // else create new document
    else {
        savedComment = await comment.save();
        res.status(201);
    }
    savedComment = await Comment.find({ _id: savedComment._id }).populate("user replies.user");
    res.json(savedComment);
};

//admin get comments
const getCommentByAdmin = async (req, res) => {
    const dateOrderFilter = validateConstants(commentQueryParams, "date", req.query.dateOrder);
    const statusFilter = validateConstants(commentQueryParams, "status", req.query.status);
    const comments = await Comment.find({ ...statusFilter })
        .sort({ ...dateOrderFilter })
        .populate("user replies.user");
    res.status(200);
    res.json(comments);
};

/* commentRouter.get(
    "/all/disabled",
    expressAsyncHandler(async (req, res) => {
        let comments = await Comment.find({ $or: [{ isDisabled: true }, { "replies.isDisabled": true }] });
        comments = comments.reduce((responseComments, currentComment) => {
            if (currentComment.isDisabled == false) {
                let disabledReplies = currentComment.replies.filter((reply) => reply.isDisabled == true);
                responseComments = [...responseComments, ...disabledReplies];
            } else {
                currentComment.replies = currentComment.replies.filter((reply) => reply.isDisabled == true);
                responseComments = [...responseComments, currentComment];
            }
            return responseComments;
        }, []);
        res.status(200);
        res.json(comments);
    })
); */

//non-user, user get comment replies
// commentRouter.get(
//     "/:parentCommentId/reply",
//     expressAsyncHandler(async (req, res) => {
//         const parentCommentId = req.params.parentCommentId || null;
//         const parentComment = await Comment.findOne({ _id: parentCommentId, isDisabled: false });
//         if (!parentComment) {
//             res.status(404);
//             throw new Error("Comment not found");
//         }
//         const replies = await Comment.find({ parentComment: parentComment._id, isDisabled: false }).populate("replies");
//         res.status(200);
//         res.json(replies);
//     })
// );

//user, admin delete comment
const deleteComment = async (req, res) => {
    const commentId = req.params.commentId || null;
    const comment = await Comment.findOne({
        $or: [
            { $and: [{ _id: commentId }, { isDisabled: false }] },
            { replies: { $elemMatch: { _id: commentId, isDisabled: false } } }
        ]
    });
    if (!comment) {
        res.status(404);
        throw new Error("Comment not found");
    }
    let deletedComment;
    //comment need to be deleted is a comment
    if (comment._id.toString() === commentId.toString()) {
        //check permission
        if (req.user._id.toString() !== comment.user.toString() && !req.user.isAdmin) {
            res.status(400);
            throw new Error("User cannot delete other users comment");
        }
        deletedComment = await Comment.findOneAndDelete({ _id: comment._id });
        //comment need to beed deleted is a reply
    } else {
        const index = comment.replies.findIndex((reply) => reply._id.toString() === commentId);
        //check permission
        if (req.user._id.toString() !== comment.replies[index].user.toString() && !req.user.isAdmin) {
            res.status(400);
            throw new Error("User cannot delete other users comment");
        }
        comment.replies.splice(index, 1);
        deletedComment = await comment.save();
    }
    if (!deletedComment) {
        res.status(500);
        throw new Error("Delete failed");
    }
    res.status(200);
    res.json({ message: "Comment has been deleted" });
};

//user, admin change comment content
const editComment = async (req, res) => {
    const commentId = req.params.commentId || null;
    const comment = await Comment.findOne({
        $or: [
            { $and: [{ _id: commentId }, { isDisabled: false }] },
            { replies: { $elemMatch: { _id: commentId, isDisabled: false } } }
        ]
    });
    if (!comment) {
        res.status(404);
        res.json({ message: "Comment not found" });
    }
    if (req.user._id.toString() !== comment.user.toString() && !req.user.isAdmin) {
        res.status(400);
        throw new Error("User cannot change other users comment");
    }
    let updatedComment;
    if (comment._id.toString() === commentId.toString()) {
        updatedComment = await Comment.findOneAndUpdate(
            { _id: comment.id },
            { content: req.body.content },
            { new: true }
        );
    } else {
        updatedComment = await Comment.findOneAndUpdate(
            { _id: comment._id },
            { $set: { "replies.$[element].content": req.body.content } },
            { new: true, arrayFilters: [{ "element._id": commentId }] }
        );
    }
    res.status(200);
    res.json(updatedComment);
};

//admin disable comment
const disableComment = async (req, res) => {
    const commentId = req.params.commentId || null;
    let index = -1;
    let productId;
    let userId;
    //find comment
    const comment = await Comment.findOne({
        $or: [
            { $and: [{ _id: commentId }, { isDisabled: false }] },
            { replies: { $elemMatch: { _id: commentId, isDisabled: false } } }
        ]
    });
    if (!comment) {
        res.status(404);
        throw new Error("Comment not found");
    }
    if (comment._id.toString() !== commentId.toString()) {
        index = comment.replies.findIndex((element) => element._id.toString() === commentId.toString());
        productId = comment.replies[index].product;
        userId = comment.replies[index].user;
    } else {
        productId = comment.product;
        userId = comment.user;
    }

    //check if product and user id is disabled
    const findProduct = Product.findOne({ _id: productId, isDisabled: false });
    const findUser = User.findOne({ _id: userId, isDisabled: false });
    const [existedProduct, existedUser] = await Promise.all([findProduct, findUser]);
    if (!existedProduct) {
        res.status(400);
        throw new Error("Product not found");
    }
    if (!existedUser) {
        res.status(400);
        throw new Error("User not found");
    }

    //disable comment
    let disabledComment;
    if (index == -1) {
        disabledComment = await Comment.findOneAndUpdate({ _id: comment._id }, { isDisabled: true }, { new: true });
    } else {
        disabledComment = await Comment.findOneAndUpdate(
            { _id: comment._id },
            { $set: { "replies.$[element].isDisabled": true } },
            { new: true, arrayFilters: [{ "element._id": commentId, "element.isDisabled": false }] }
        );
    }
    //disable failed
    if (!disabledComment) {
        res.status(500);
        throw new Error("Disable comment failed");
    }
    //Note: return unsaved comment
    res.status(200);
    res.json(disabledComment);
};

//admin restore comment
const restoreComment = async (req, res) => {
    const commentId = req.params.commentId || null;
    let index = -1;
    let productId;
    let userId;

    //find comment
    const comment = await Comment.findOne({
        $or: [
            { $and: [{ _id: commentId }, { isDisabled: true }] },
            { replies: { $elemMatch: { _id: commentId, isDisabled: true } } }
        ]
    });
    if (!comment) {
        res.status(404);
        throw new Error("Comment not found");
    }

    //if the comment need to disable is a reply => save its index, productId and userId
    if (comment._id.toString() !== commentId.toString()) {
        index = comment.replies.findIndex((element) => element._id.toString() === commentId.toString());
        productId = comment.replies[index].product;
        userId = comment.replies[index].user;
    } else {
        productId = comment.product;
        userId = comment.user;
    }
    //check if product and user id is disabled
    const findProduct = Product.findOne({ _id: productId, isDisabled: false });
    const findUser = User.findOne({ _id: userId, isDisabled: false });
    const [existedProduct, existedUser] = await Promise.all([findProduct, findUser]);
    if (!existedProduct) {
        res.status(400);
        throw new Error("Product not found");
    }
    if (!existedUser) {
        res.status(400);
        throw new Error("User not found");
    }

    //restore comment
    //case comment need to disable is a reply
    let restoredComment;
    if (index != -1) {
        restoredComment = await Comment.findOneAndUpdate(
            { _id: comment._id },
            { $set: { "replies.$[element].isDisabled": false } },
            { new: true, arrayFilters: [{ "element._id": commentId, "element.isDisabled": true }] }
        );
        //case comment need to disable is a comment
    } else {
        restoredComment = await Comment.findOneAndUpdate({ _id: comment._id }, { isDisabled: false }, { new: true });
    }
    //restore failed
    if (!restoredComment) {
        res.status(500);
        throw new Error("Restore failed");
    }
    //Note: return unsaved comment
    res.status(200);
    res.json(restoredComment);
};

const CommentControler = {
    createComment,
    getCommentByAdmin,
    deleteComment,
    editComment,
    disableComment,
    restoreComment
};

export default CommentControler;
