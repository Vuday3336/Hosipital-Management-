import mongoose from "mongoose";

const bedSchema = new mongoose.Schema(
  {
    ward: { type: mongoose.Schema.Types.ObjectId, ref: "Ward", required: true },
    bedNumber: { type: String, required: true, trim: true },
    isOccupied: { type: Boolean, default: false },
    currentAdmission: { type: mongoose.Schema.Types.ObjectId, ref: "Admission", default: null },
  },
  { timestamps: true }
);

bedSchema.index({ ward: 1, bedNumber: 1 }, { unique: true });

export const Bed = mongoose.model("Bed", bedSchema);
