import { z } from "zod";

export const createMedicineSchema = z.object({
  name: z.string().trim().min(1),
  genericName: z.string().trim().optional(),
  category: z.string().trim().optional(),
  manufacturer: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(20),
  unitPrice: z.number().min(0).default(0),
  batchNumber: z.string().optional(),
  expiryDate: z.coerce.date().optional(),
});

export const updateMedicineSchema = createMedicineSchema.partial();

export const adjustStockSchema = z.object({
  delta: z.number().int().refine((v) => v !== 0, "delta must be non-zero"),
  reason: z.string().trim().optional(),
});

export const dispenseSchema = z.object({
  medicine: z.string().min(1),
  patient: z.string().min(1),
  prescription: z.string().optional(),
  quantity: z.number().int().positive(),
});

export const listMedicinesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  lowStock: z.enum(["true", "false"]).optional(),
});
