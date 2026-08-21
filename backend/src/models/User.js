import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "doctor", "receptionist", "patient"],
      required: true,
    },
    phone: { type: String, trim: true },
    avatarUrl: { type: String },
    isActive: { type: Boolean, default: true },
    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    avatarUrl: this.avatarUrl,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", userSchema);
