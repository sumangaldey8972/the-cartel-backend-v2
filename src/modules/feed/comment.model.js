import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { COMMENT_STATUSES } from "./feed.constants.js";

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null, index: true },
    content: { type: String, required: true, trim: true, maxlength: 1_000 },
    status: { type: String, enum: COMMENT_STATUSES, default: "PUBLISHED", index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

commentSchema.index({ post: 1, status: 1, createdAt: -1 });
commentSchema.plugin(mongoosePaginate);

export const Comment = mongoose.models.Comment ?? mongoose.model("Comment", commentSchema);
