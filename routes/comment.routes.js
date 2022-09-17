import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/auth.middleware.js";
import CommentControler from "../controllers/comment.controller.js";
const commentRouter = express.Router();

// commentRouter.get("/all/disabled", expressAsyncHandler());
// commentRouter.get("/:parentCommentId/reply", expressAsyncHandler());
commentRouter.patch("/:commentId/content", protect, expressAsyncHandler(CommentControler.editComment));
commentRouter.patch("/:commentId/disable", protect, admin, expressAsyncHandler(CommentControler.disableComment));
commentRouter.patch("/:commentId/restore", protect, admin, expressAsyncHandler(CommentControler.restoreComment));
commentRouter.delete("/:commentId", protect, expressAsyncHandler(CommentControler.deleteComment));
commentRouter.post("/", protect, expressAsyncHandler(CommentControler.createComment));
commentRouter.get("/", protect, admin, expressAsyncHandler(CommentControler.getCommentByAdmin));

export default commentRouter;
