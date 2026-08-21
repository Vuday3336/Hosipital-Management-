import mongoose from "mongoose";

const wardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    type: { type: String, enum: ["general", "icu", "private", "maternity", "pediatric"], required: true },
    floor: { type: Number, default: 0 },
    totalBeds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Ward = mongoose.model("Ward", wardSchema);
