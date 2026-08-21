import { Appointment } from "../models/Appointment.js";
import { Patient } from "../models/Patient.js";
import { Doctor } from "../models/Doctor.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";
import * as appointmentService from "../services/appointment.service.js";
import { notifyUser } from "../services/notification.service.js";
import { sendAppointmentConfirmationEmail } from "../services/email.service.js";

export const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.bookAppointment({
    ...req.body,
    bookedBy: req.user.id,
  });

  const populated = await appointment.populate([
    { path: "doctor", populate: { path: "user", select: "name email" } },
    { path: "patient", select: "firstName lastName user" },
  ]);

  const recipientEmail = populated.patient?.email || populated.patient?.user?.email;
  if (recipientEmail) {
    sendAppointmentConfirmationEmail(recipientEmail, {
      doctorName: populated.doctor.user.name,
      date: appointment.date,
      startTime: appointment.startTime,
    }).catch(() => {});
  }
  if (populated.patient?.user) {
    notifyUser({
      userId: populated.patient.user,
      type: "appointment_confirmation",
      title: "Appointment booked",
      message: `Your appointment with Dr. ${populated.doctor.user.name} on ${appointment.date} at ${appointment.startTime} is ${appointment.status}.`,
      relatedEntity: { kind: "Appointment", id: appointment._id },
    }).catch(() => {});
  }

  sendSuccess(res, { statusCode: 201, message: "Appointment booked", data: { appointment } });
});

export const listAppointments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, doctor, patient, date, from, to } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (doctor) filter.doctor = doctor;
  if (patient) filter.patient = patient;
  if (date) filter.date = date;
  if (from || to) filter.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };

  // Scope results for doctor/patient callers to their own records.
  if (req.user.role === "doctor") {
    const doctorDoc = await Doctor.findOne({ user: req.user.id });
    filter.doctor = doctorDoc?._id;
  } else if (req.user.role === "patient") {
    const patientDoc = await Patient.findOne({ user: req.user.id });
    filter.patient = patientDoc?._id;
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate({ path: "doctor", populate: [{ path: "user", select: "name" }, { path: "department", select: "name" }] })
      .populate("patient", "firstName lastName phone")
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);

  sendSuccess(res, { data: appointments, meta: buildMeta({ page, limit, total }) });
});

export const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({ path: "doctor", populate: ["user", "department"] })
    .populate("patient");
  if (!appointment) throw ApiError.notFound("Appointment not found");
  sendSuccess(res, { data: { appointment } });
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, ...(req.body.notes ? { notes: req.body.notes } : {}) },
    { new: true, runValidators: true }
  );
  if (!appointment) throw ApiError.notFound("Appointment not found");
  sendSuccess(res, { message: "Appointment status updated", data: { appointment } });
});

export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.rescheduleAppointment(req.params.id, req.body);
  sendSuccess(res, { message: "Appointment rescheduled", data: { appointment } });
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: "cancelled" },
    { new: true }
  );
  if (!appointment) throw ApiError.notFound("Appointment not found");
  sendSuccess(res, { message: "Appointment cancelled", data: { appointment } });
});

export const getDoctorAvailability = asyncHandler(async (req, res) => {
  const slots = await appointmentService.getAvailability(req.params.doctorId, req.query.date);
  sendSuccess(res, { data: { date: req.query.date, slots } });
});
