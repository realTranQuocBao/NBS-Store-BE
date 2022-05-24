import Comment from "../models/CommentModel.js";

async function deleteCommentById(commentId) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      //throw new Error("Comment not found in deleteCommentById function");
      return;
    }
    //delete reply
    for (const reply of comment.replies) {
      deleteCommentById(reply._id);
    }
    //delete this comment
    return await Comment.findByIdAndDelete(commentId, { new: true });
  }
  
async function deleteReplyById(replyId) {
    const comment = await Comment.findById(replyId);
    if (!comment) {
      return;
    }
    //delete reply
    for (const reply of comment.replies) {
      deleteReplyById(reply._id);
    }
    //unlink parent comment
    const updatedParentComment = await Comment.findOneAndUpdate(
      { _id: comment.parentComment },
      { $pull: { replies: comment._id } },);
    //delete this reply
    return await Comment.findOneAndDelete({ _id: replyId }, { new: true });
}

//disable both comment and reply
/* async function disableCommentById(commentId) {
  const comment = await Comment.findOne({ _id: commentId, isDisabled: false });
  if (comment.isDisabled) {
    return;
  }
  //disable reply
  for (const reply of comment.replies) {
    disableCommentById(reply._id);
  }
  //disable this comment
  return await Comment.findByIdAndUpdate(commentId, { isDisabled: true }, { new: true });
} */

//restore both comment and reply
/* async function restoreCommentById(commentId) {
  const comment = await Comment.findOne({ _id: commentId, isDisabled: true });
  if (!comment) {
    return;
  }
  //restore reply
  for (const reply of comment.replies) {
    restoreCommentById(reply._id);
  }
  //restore this comment
  return await Comment.findByIdAndUpdate(commentId, { isDisabled: false }, { new: true });
} */


export {deleteCommentById, deleteReplyById}