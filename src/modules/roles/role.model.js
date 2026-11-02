import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { ROLE_CODES } from "./role.constants.js";

const roleSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, enum: ROLE_CODES, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 240 },
    isSystem: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    // The application imports models before the server opens MongoDB. Keep
    // collection/index creation explicit so model compilation cannot race the
    // connection during serverless cold starts or maintenance scripts.
    autoCreate: false,
    autoIndex: false,
  },
);

roleSchema.index({ code: 1 }, { unique: true });
roleSchema.plugin(mongoosePaginate);

export const Role = mongoose.models.Role ?? mongoose.model("Role", roleSchema);
