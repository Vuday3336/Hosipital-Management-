import { z } from "zod";

const scheduleSlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm"),
  slotDurationMinutes: z.number().int().positive().default(30),
});

export const createDoctorSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  specialization: z.string().trim().min(2),
  qualifications: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).optional(),
  consultationFee: z.number().min(0).optional(),
  schedule: z.array(scheduleSlotSchema).optional(),
});

export const updateDoctorSchema = z.object({
  department: z.string().optional(),
  specialization: z.string().trim().optional(),
  qualifications: z.array(z.string()).optional(),
  experienceYears: z.number().int().min(0).optional(),
  consultationFee: z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
});

export const setScheduleSchema = z.object({
  schedule: z.array(scheduleSlotSchema),
});

export const listDoctorsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  department: z.string().optional(),
  specialization: z.string().optional(),
  search: z.string().optional(),
});
