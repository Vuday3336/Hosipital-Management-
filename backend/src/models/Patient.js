import mongoose from "mongoose";

const medicalHistoryEntrySchema = new mongoose.Schema(
  {
    condition: { type: String, required: true },
    diagnosedDate: { type: Date },
    notes: { type: String },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const patientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"],
      default: "unknown",
    },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: {
      line1: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    medicalHistory: { type: [medicalHistoryEntrySchema], default: [] },
    allergies: { type: [String], default: [] },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

patientSchema.index({ firstName: "text", lastName: "text", phone: "text", email: "text" });

export const Patient = mongoose.model("Patient", patientSchema);
