import mongoose from "mongoose";

const prescribedMedicineSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    diagnosis: { type: String, required: true },
    medicines: { type: [prescribedMedicineSchema], default: [] },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Prescription = mongoose.model("Prescription", prescriptionSchema);
