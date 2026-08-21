import { z } from "zod";

const addressSchema = z
  .object({
    line1: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  })
  .optional();

const emergencyContactSchema = z
  .object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    phone: z.string().optional(),
  })
  .optional();

export const createPatientSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  dob: z.coerce.date(),
  gender: z.enum(["male", "female", "other"]),
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"])
    .default("unknown"),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  address: addressSchema,
  emergencyContact: emergencyContactSchema,
  allergies: z.array(z.string()).optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export const addMedicalHistorySchema = z.object({
  condition: z.string().trim().min(1),
  diagnosedDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  doctor: z.string().optional(),
});

export const listPatientsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  bloodGroup: z.string().optional(),
});
