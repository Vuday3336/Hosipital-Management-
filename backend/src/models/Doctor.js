import mongoose from "mongoose";

const scheduleSlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "17:00"
    slotDurationMinutes: { type: Number, default: 30 },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    specialization: { type: String, required: true, trim: true },
    qualifications: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    schedule: { type: [scheduleSlotSchema], default: [] },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Doctor = mongoose.model("Doctor", doctorSchema);
