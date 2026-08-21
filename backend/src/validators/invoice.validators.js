import { z } from "zod";

const invoiceItemSchema = z.object({
  description: z.string().trim().min(1),
  category: z.enum(["consultation", "medicine", "room", "lab", "procedure", "other"]).default("other"),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().min(0),
});

export const createInvoiceSchema = z.object({
  patient: z.string().min(1),
  appointment: z.string().optional(),
  admission: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  taxRate: z.number().min(0).max(1).default(0),
  discount: z.number().min(0).default(0),
  dueDate: z.coerce.date().optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.enum(["cash", "card", "insurance", "upi", "other"]),
});

export const listInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  paymentStatus: z.enum(["unpaid", "partial", "paid"]).optional(),
  patient: z.string().optional(),
});
