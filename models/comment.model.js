import mongoose from "mongoose";

const commentSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Product"
        },
        content: {
            type: String,
            required: true
        },
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: "Comment"
        },
        isDisabled: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    {
        timestamps: true
    }
);
commentSchema.add({ replies: [commentSchema] });
const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
