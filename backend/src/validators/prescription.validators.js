import { z } from "zod";

const prescribedMedicineSchema = z.object({
  medicine: z.string().optional(),
  name: z.string().trim().min(1),
  dosage: z.string().trim().min(1),
  frequency: z.string().trim().min(1),
  duration: z.string().trim().min(1),
  instructions: z.string().optional(),
});

export const createPrescriptionSchema = z.object({
  appointment: z.string().optional(),
  patient: z.string().min(1),
  diagnosis: z.string().trim().min(1),
  medicines: z.array(prescribedMedicineSchema).min(1),
  notes: z.string().optional(),
});
