import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { POST_STATUSES, REPLY_PERMISSIONS } from "./feed.constants.js";

const mediaSchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true, trim: true, maxlength: 300 },
    secureUrl: { type: String, required: true, trim: true, maxlength: 1_000 },
    resourceType: { type: String, required: true, enum: ["image", "video"] },
    format: { type: String, trim: true, maxlength: 30 },
    width: { type: Number, min: 1 },
    height: { type: Number, min: 1 },
    bytes: { type: Number, min: 0 },
    duration: { type: Number, min: 0 },
    altText: { type: String, trim: true, maxlength: 1_000, default: "" },
    taggedPeople: { type: [{ type: String, trim: true, maxlength: 30 }], default: [] },
    madeWithAi: { type: Boolean, default: false },
    cropAspect: { type: String, enum: ["original", "1 / 1", "16 / 9", "4 / 5"], default: "original" },
    cropX: { type: Number, min: 0, max: 100, default: 50 },
    cropY: { type: Number, min: 0, max: 100, default: 50 },
    zoom: { type: Number, min: 1, max: 2.5, default: 1 },
  },
  { _id: false },
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, trim: true, maxlength: 1_000, default: "" },
    tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 80 }], default: [] },
    media: { type: [mediaSchema], default: [], validate: { validator: (media) => media.length <= 4, message: "A post can contain at most four media assets" } },
    replyPermission: { type: String, enum: REPLY_PERMISSIONS, default: "EVERYONE" },
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
    shareCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: POST_STATUSES, default: "PUBLISHED", index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ tags: 1, status: 1, createdAt: -1 });
postSchema.index({ author: 1, status: 1, createdAt: -1 });
postSchema.plugin(mongoosePaginate);

export const Post = mongoose.models.Post ?? mongoose.model("Post", postSchema);
