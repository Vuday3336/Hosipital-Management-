import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    headDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  },
  { timestamps: true }
);

export const Department = mongoose.model("Department", departmentSchema);
