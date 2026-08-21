import { z } from "zod";

export const createPatientSchema = z.object({
  firstName: z.string().trim().min(1, "Required"),
  lastName: z.string().trim().min(1, "Required"),
  dob: z.string().min(1, "Required"),
  gender: z.enum(["male", "female", "other"]),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"]).default("unknown"),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
});

// Editing an existing patient shouldn't block on fields a self-registered
// patient never filled in (dob/gender start blank until completed later).
export const updatePatientSchema = createPatientSchema.partial().extend({
  dob: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other"]).optional().or(z.literal("")),
});
