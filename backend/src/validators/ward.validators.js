import { z } from "zod";

export const createWardSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(["general", "icu", "private", "maternity", "pediatric"]),
  floor: z.number().int().optional(),
  totalBeds: z.number().int().min(0).optional(),
});

export const createBedSchema = z.object({
  ward: z.string().min(1),
  bedNumber: z.string().trim().min(1),
});
