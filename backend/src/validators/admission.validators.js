import { z } from "zod";

export const createAdmissionSchema = z.object({
  patient: z.string().min(1),
  attendingDoctor: z.string().min(1),
  ward: z.string().min(1),
  bed: z.string().min(1),
  reasonForAdmission: z.string().trim().min(2),
});

export const dischargeAdmissionSchema = z.object({
  summary: z.string().trim().min(2),
  followUpInstructions: z.string().trim().optional(),
});

export const listAdmissionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(["admitted", "discharged"]).optional(),
  patient: z.string().optional(),
});
