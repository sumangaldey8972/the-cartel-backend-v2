import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    ipAddress: { type: String, default: null, maxlength: 80 },
    userAgent: { type: String, default: null, maxlength: 500 },
    lastSeenAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ user: 1, revokedAt: 1, expiresAt: 1 });
sessionSchema.plugin(mongoosePaginate);

export const Session = mongoose.models.Session ?? mongoose.model("Session", sessionSchema);
