import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";
import { serialize } from "../utils/serialize.js";
import { computeInvoiceTotals, computePaymentStatus } from "../services/billing.service.js";
import { generateInvoicePdf } from "../services/pdf.service.js";

const patientSelect = { patient: { select: { id: true, firstName: true, lastName: true } } };

export const createInvoice = asyncHandler(async (req, res) => {
  const { patient, appointment, admission, items, taxRate, discount, dueDate } = req.body;
  const totals = computeInvoiceTotals(items, { taxRate, discount });

  const invoice = await prisma.invoice.create({
    data: { patientId: patient, appointmentId: appointment, admissionId: admission, ...totals, dueDate, createdById: req.user.id },
  });

  sendSuccess(res, { statusCode: 201, message: "Invoice created", data: { invoice: serialize(invoice) } });
});

export const listInvoices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const where = {};
  if (req.query.paymentStatus) where.paymentStatus = req.query.paymentStatus;

  if (req.user.role === "patient") {
    const patientDoc = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    // Fail closed: a missing linked profile must return nothing, not everyone's invoices.
    if (!patientDoc) return sendSuccess(res, { data: [], meta: buildMeta({ page, limit, total: 0 }) });
    where.patientId = patientDoc.id;
  } else if (req.query.patient) {
    where.patientId = req.query.patient;
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({ where, include: patientSelect, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.invoice.count({ where }),
  ]);

  sendSuccess(res, { data: serialize(invoices), meta: buildMeta({ page, limit, total }) });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { patient: true } });
  if (!invoice) throw ApiError.notFound("Invoice not found");
  sendSuccess(res, { data: { invoice: serialize(invoice) } });
});

export const recordPayment = asyncHandler(async (req, res) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
  if (!invoice) throw ApiError.notFound("Invoice not found");

  const paidAmount = Math.round((invoice.paidAmount + req.body.amount) * 100) / 100;
  const updated = await prisma.invoice.update({
    where: { id: req.params.id },
    data: { paidAmount, paymentMethod: req.body.paymentMethod, paymentStatus: computePaymentStatus(invoice.totalAmount, paidAmount) },
  });

  sendSuccess(res, { message: "Payment recorded", data: { invoice: serialize(updated) } });
});

export const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id }, include: { patient: true } });
  if (!invoice) throw ApiError.notFound("Invoice not found");

  const pdfUrl = await generateInvoicePdf(invoice, invoice.patient);
  await prisma.invoice.update({ where: { id: req.params.id }, data: { pdfUrl } });

  sendSuccess(res, { data: { pdfUrl } });
});
