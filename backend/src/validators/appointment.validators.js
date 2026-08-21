import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createAppointmentSchema = z
  .object({
    patient: z.string().min(1, "Patient is required"),
    doctor: z.string().min(1, "Doctor is required"),
    date: z.string().regex(dateRegex, "Use YYYY-MM-DD"),
    startTime: z.string().regex(timeRegex, "Use HH:mm"),
    endTime: z.string().regex(timeRegex, "Use HH:mm"),
    reason: z.string().trim().optional(),
  })
  .refine((v) => v.startTime < v.endTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  notes: z.string().optional(),
});

export const rescheduleAppointmentSchema = z.object({
  date: z.string().regex(dateRegex, "Use YYYY-MM-DD"),
  startTime: z.string().regex(timeRegex, "Use HH:mm"),
  endTime: z.string().regex(timeRegex, "Use HH:mm"),
});

export const listAppointmentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  doctor: z.string().optional(),
  patient: z.string().optional(),
  date: z.string().regex(dateRegex).optional(),
  from: z.string().regex(dateRegex).optional(),
  to: z.string().regex(dateRegex).optional(),
});

export const availabilityQuerySchema = z.object({
  date: z.string().regex(dateRegex, "Use YYYY-MM-DD"),
});
