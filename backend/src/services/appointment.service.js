import { Appointment } from "../models/Appointment.js";
import { Doctor } from "../models/Doctor.js";
import { ApiError } from "../utils/ApiError.js";

const ACTIVE_STATUSES = ["pending", "confirmed"];

// JS Date.getDay(): 0 = Sunday ... 6 = Saturday, matching Doctor.schedule.dayOfWeek.
export const dayOfWeekFor = (dateStr) => new Date(`${dateStr}T00:00:00Z`).getUTCDay();

export const isWithinDoctorSchedule = (doctor, date, startTime, endTime) => {
  const dow = dayOfWeekFor(date);
  return doctor.schedule.some(
    (slot) => slot.dayOfWeek === dow && startTime >= slot.startTime && endTime <= slot.endTime
  );
};

// Two [start,end) ranges overlap unless one ends at/before the other starts.
export const timesOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

export const findConflictingAppointment = async ({ doctor, date, startTime, endTime, excludeId }) => {
  const candidates = await Appointment.find({
    doctor,
    date,
    status: { $in: ACTIVE_STATUSES },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  return candidates.find((appt) => timesOverlap(startTime, endTime, appt.startTime, appt.endTime)) || null;
};

export const bookAppointment = async ({ patient, doctor, department, date, startTime, endTime, reason, bookedBy }) => {
  const doctorDoc = await Doctor.findById(doctor);
  if (!doctorDoc) throw ApiError.notFound("Doctor not found");
  if (!doctorDoc.isAvailable) throw ApiError.badRequest("Doctor is not currently accepting appointments");

  if (doctorDoc.schedule.length && !isWithinDoctorSchedule(doctorDoc, date, startTime, endTime)) {
    throw ApiError.badRequest("Requested time is outside the doctor's working hours");
  }

  const conflict = await findConflictingAppointment({ doctor, date, startTime, endTime });
  if (conflict) {
    throw ApiError.conflict("This time slot is already booked for the selected doctor");
  }

  try {
    return await Appointment.create({
      patient,
      doctor,
      department: department || doctorDoc.department,
      date,
      startTime,
      endTime,
      reason,
      bookedBy,
    });
  } catch (err) {
    if (err.code === 11000) {
      // Lost a race against a concurrent booking for the exact same slot.
      throw ApiError.conflict("This time slot is already booked for the selected doctor");
    }
    throw err;
  }
};

export const rescheduleAppointment = async (appointmentId, { date, startTime, endTime }) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw ApiError.notFound("Appointment not found");

  const conflict = await findConflictingAppointment({
    doctor: appointment.doctor,
    date,
    startTime,
    endTime,
    excludeId: appointment._id,
  });
  if (conflict) {
    throw ApiError.conflict("This time slot is already booked for the selected doctor");
  }

  appointment.date = date;
  appointment.startTime = startTime;
  appointment.endTime = endTime;
  appointment.status = "pending";
  await appointment.save();
  return appointment;
};

// Free slots for a doctor on a given date, derived from their weekly schedule minus booked appointments.
export const getAvailability = async (doctorId, date) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw ApiError.notFound("Doctor not found");

  const dow = dayOfWeekFor(date);
  const daySlots = doctor.schedule.filter((s) => s.dayOfWeek === dow);
  if (!daySlots.length) return [];

  const booked = await Appointment.find({ doctor: doctorId, date, status: { $in: ACTIVE_STATUSES } });

  const slots = [];
  for (const block of daySlots) {
    let cursor = block.startTime;
    while (cursor < block.endTime) {
      const [h, m] = cursor.split(":").map(Number);
      const endMinutes = h * 60 + m + block.slotDurationMinutes;
      const end = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
      if (end > block.endTime) break;

      const isBooked = booked.some((appt) => timesOverlap(cursor, end, appt.startTime, appt.endTime));
      slots.push({ startTime: cursor, endTime: end, available: !isBooked });
      cursor = end;
    }
  }
  return slots;
};
