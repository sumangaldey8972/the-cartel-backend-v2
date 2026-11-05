import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const tagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
    usageCount: { type: Number, default: 0, min: 0, index: true },
    lastUsedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, versionKey: false },
);

tagSchema.index({ name: 1 }, { unique: true });
tagSchema.index({ usageCount: -1, lastUsedAt: -1 });
tagSchema.plugin(mongoosePaginate);

export const Tag = mongoose.models.Tag ?? mongoose.model("Tag", tagSchema);
