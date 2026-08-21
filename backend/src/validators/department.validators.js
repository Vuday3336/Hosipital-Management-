import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
  headDoctor: z.string().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();
