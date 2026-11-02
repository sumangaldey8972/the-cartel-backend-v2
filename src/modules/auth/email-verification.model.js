import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    otpHash: { type: String, required: true, select: false },
    attempts: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, required: true },
    resendAvailableAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailVerification = mongoose.models.EmailVerification
  ?? mongoose.model("EmailVerification", emailVerificationSchema);
