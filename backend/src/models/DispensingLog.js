import mongoose from "mongoose";

const dispensingLogSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription" },
    quantity: { type: Number, required: true, min: 1 },
    dispensedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dispensedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const DispensingLog = mongoose.model("DispensingLog", dispensingLogSchema);
