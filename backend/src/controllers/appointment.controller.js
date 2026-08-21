import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";
import { serialize, publicUserSelect } from "../utils/serialize.js";
import * as appointmentService from "../services/appointment.service.js";
import { notifyUser } from "../services/notification.service.js";
import { sendAppointmentConfirmationEmail } from "../services/email.service.js";

const doctorWithUser = { doctor: { include: { user: { select: publicUserSelect }, department: { select: { id: true, name: true } } } } };
const patientBasic = { patient: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, userId: true } } };

export const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.bookAppointment({
    ...req.body,
    bookedBy: req.user.id,
  });

  const populated = await prisma.appointment.findUnique({
    where: { id: appointment.id },
    include: { ...doctorWithUser, ...patientBasic },
  });

  const recipientEmail = populated.patient?.email;
  if (recipientEmail) {
    sendAppointmentConfirmationEmail(recipientEmail, {
      doctorName: populated.doctor.user.name,
      date: appointment.date,
      startTime: appointment.startTime,
    }).catch(() => {});
  }
  if (populated.patient?.userId) {
    notifyUser({
      userId: populated.patient.userId,
      type: "appointment_confirmation",
      title: "Appointment booked",
      message: `Your appointment with Dr. ${populated.doctor.user.name} on ${appointment.date} at ${appointment.startTime} is ${appointment.status}.`,
      relatedEntity: { kind: "Appointment", id: appointment.id },
    }).catch(() => {});
  }

  sendSuccess(res, { statusCode: 201, message: "Appointment booked", data: { appointment: serialize(appointment) } });
});

export const listAppointments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, doctor, patient, date, from, to } = req.query;

  const where = {};
  if (status) where.status = status;
  if (doctor) where.doctorId = doctor;
  if (patient) where.patientId = patient;
  if (date) where.date = date;
  if (from || to) where.date = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

  // Scope results for doctor/patient callers to their own records. A missing profile
  // must fail CLOSED (no results) — an unset filter key would otherwise match everyone.
  if (req.user.role === "doctor") {
    const doctorDoc = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctorDoc) return sendSuccess(res, { data: [], meta: buildMeta({ page, limit, total: 0 }) });
    where.doctorId = doctorDoc.id;
  } else if (req.user.role === "patient") {
    const patientDoc = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patientDoc) return sendSuccess(res, { data: [], meta: buildMeta({ page, limit, total: 0 }) });
    where.patientId = patientDoc.id;
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        doctor: { include: { user: { select: { id: true, name: true } } } },
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      skip,
      take: limit,
    }),
    prisma.appointment.count({ where }),
  ]);

  sendSuccess(res, { data: serialize(appointments), meta: buildMeta({ page, limit, total }) });
});

export const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: { ...doctorWithUser, patient: true },
  });
  if (!appointment) throw ApiError.notFound("Appointment not found");
  sendSuccess(res, { data: { appointment: serialize(appointment) } });
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appointment = await prisma.appointment
    .update({
      where: { id: req.params.id },
      data: { status: req.body.status, ...(req.body.notes ? { notes: req.body.notes } : {}) },
    })
    .catch(() => null);
  if (!appointment) throw ApiError.notFound("Appointment not found");
  sendSuccess(res, { message: "Appointment status updated", data: { appointment: serialize(appointment) } });
});

export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.rescheduleAppointment(req.params.id, req.body);
  sendSuccess(res, { message: "Appointment rescheduled", data: { appointment: serialize(appointment) } });
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await prisma.appointment
    .update({ where: { id: req.params.id }, data: { status: "cancelled" } })
    .catch(() => null);
  if (!appointment) throw ApiError.notFound("Appointment not found");
  sendSuccess(res, { message: "Appointment cancelled", data: { appointment: serialize(appointment) } });
});

export const getDoctorAvailability = asyncHandler(async (req, res) => {
  const slots = await appointmentService.getAvailability(req.params.doctorId, req.query.date);
  sendSuccess(res, { data: { date: req.query.date, slots } });
});
