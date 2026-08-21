import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD" — keeps the conflict index simple and timezone-free
    startTime: { type: String, required: true }, // "HH:mm"
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    reason: { type: String, trim: true },
    notes: { type: String, trim: true },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// The double-booking guard: one doctor can hold only one non-cancelled slot per date+time.
appointmentSchema.index(
  { doctor: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  }
);

export const Appointment = mongoose.model("Appointment", appointmentSchema);
