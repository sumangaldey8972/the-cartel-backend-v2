import mongoose from "mongoose";

const requestThrottleSchema = new mongoose.Schema(
  {
    _id: { type: String },
    count: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false },
);

requestThrottleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RequestThrottle = mongoose.models.RequestThrottle
  ?? mongoose.model("RequestThrottle", requestThrottleSchema);
