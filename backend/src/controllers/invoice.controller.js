import { Invoice } from "../models/Invoice.js";
import { Patient } from "../models/Patient.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";
import { computeInvoiceTotals, computePaymentStatus } from "../services/billing.service.js";
import { generateInvoicePdf } from "../services/pdf.service.js";

export const createInvoice = asyncHandler(async (req, res) => {
  const { patient, appointment, admission, items, taxRate, discount, dueDate } = req.body;
  const totals = computeInvoiceTotals(items, { taxRate, discount });

  const invoice = await Invoice.create({
    patient,
    appointment,
    admission,
    ...totals,
    dueDate,
    createdBy: req.user.id,
  });

  sendSuccess(res, { statusCode: 201, message: "Invoice created", data: { invoice } });
});

export const listInvoices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  if (req.user.role === "patient") {
    const patientDoc = await Patient.findOne({ user: req.user.id });
    // Fail closed: an unset filter key is dropped by the driver and would otherwise
    // return every invoice in the hospital to a patient with no linked profile yet.
    if (!patientDoc) return sendSuccess(res, { data: [], meta: buildMeta({ page, limit, total: 0 }) });
    filter.patient = patientDoc._id;
  } else if (req.query.patient) {
    filter.patient = req.query.patient;
  }

  const [invoices, total] = await Promise.all([
    Invoice.find(filter).populate("patient", "firstName lastName").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Invoice.countDocuments(filter),
  ]);

  sendSuccess(res, { data: invoices, meta: buildMeta({ page, limit, total }) });
});

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate("patient");
  if (!invoice) throw ApiError.notFound("Invoice not found");
  sendSuccess(res, { data: { invoice } });
});

export const recordPayment = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw ApiError.notFound("Invoice not found");

  invoice.paidAmount = Math.round((invoice.paidAmount + req.body.amount) * 100) / 100;
  invoice.paymentMethod = req.body.paymentMethod;
  invoice.paymentStatus = computePaymentStatus(invoice.totalAmount, invoice.paidAmount);
  await invoice.save();

  sendSuccess(res, { message: "Payment recorded", data: { invoice } });
});

export const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate("patient");
  if (!invoice) throw ApiError.notFound("Invoice not found");

  const pdfUrl = await generateInvoicePdf(invoice, invoice.patient);
  invoice.pdfUrl = pdfUrl;
  await invoice.save();

  sendSuccess(res, { data: { pdfUrl } });
});
