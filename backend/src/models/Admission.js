import mongoose from "mongoose";

const admissionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    attendingDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    ward: { type: mongoose.Schema.Types.ObjectId, ref: "Ward", required: true },
    bed: { type: mongoose.Schema.Types.ObjectId, ref: "Bed", required: true },
    admissionDate: { type: Date, required: true, default: Date.now },
    dischargeDate: { type: Date, default: null },
    status: { type: String, enum: ["admitted", "discharged"], default: "admitted" },
    reasonForAdmission: { type: String, required: true },
    dischargeSummary: {
      summary: { type: String },
      followUpInstructions: { type: String },
      pdfUrl: { type: String },
      generatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

export const Admission = mongoose.model("Admission", admissionSchema);
