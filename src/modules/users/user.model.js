import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { USER_STATUS } from "./user.constants.js";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, minlength: 1, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, minlength: 1, maxlength: 50 },
    username: { type: String, required: true, trim: true, lowercase: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    roles: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true }],
      default: [],
      set: (roles) => [...new Map(roles.map((role) => [role.toString(), role])).values()],
      validate: { validator: (roles) => roles.length > 0, message: "A user must have at least one role" },
    },
    status: { type: String, enum: USER_STATUS, default: "ACTIVE", index: true },
    emailVerifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_document, returnedObject) {
        delete returnedObject.passwordHash;
        return returnedObject;
      },
    },
  },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ roles: 1 });
userSchema.plugin(mongoosePaginate);

userSchema.methods.hasAnyRole = function hasAnyRole(roles) {
  const assignedRoleCodes = this.roles
    .map((role) => (typeof role === "string" ? role : role?.code))
    .filter(Boolean);
  return roles.some((role) => assignedRoleCodes.includes(role));
};

export const User = mongoose.models.User ?? mongoose.model("User", userSchema);
