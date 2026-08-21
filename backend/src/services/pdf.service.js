import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { env } from "../config/env.js";

const ensureDir = () => {
  if (!fs.existsSync(env.upload.dir)) fs.mkdirSync(env.upload.dir, { recursive: true });
};

const finalizeDoc = (doc, filename) =>
  new Promise((resolve, reject) => {
    ensureDir();
    const filePath = path.join(env.upload.dir, filename);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.end();
    stream.on("finish", () => resolve(`/${env.upload.dir}/${filename}`));
    stream.on("error", reject);
  });

const header = (doc, title) => {
  doc.fontSize(20).fillColor("#0f7a6b").text("Hospital Management System", { align: "left" });
  doc.moveDown(0.2);
  doc.fontSize(14).fillColor("#14211e").text(title);
  doc.moveDown(0.5);
  doc.strokeColor("#dde3e0").moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown();
  doc.fillColor("#14211e");
};

export const generateDischargeSummaryPdf = async (admission, patient, doctor) => {
  const doc = new PDFDocument({ margin: 50 });
  header(doc, "Discharge Summary");

  doc.fontSize(11);
  doc.text(`Patient: ${patient.firstName} ${patient.lastName}`);
  doc.text(`Attending Doctor: Dr. ${doctor.user?.name || ""}`);
  doc.text(`Admission Date: ${new Date(admission.admissionDate).toDateString()}`);
  doc.text(`Discharge Date: ${new Date(admission.dischargeDate).toDateString()}`);
  doc.moveDown();
  doc.fontSize(12).text("Reason for Admission", { underline: true });
  doc.fontSize(11).text(admission.reasonForAdmission || "-");
  doc.moveDown();
  doc.fontSize(12).text("Summary", { underline: true });
  doc.fontSize(11).text(admission.dischargeSummary?.summary || "-");
  doc.moveDown();
  doc.fontSize(12).text("Follow-up Instructions", { underline: true });
  doc.fontSize(11).text(admission.dischargeSummary?.followUpInstructions || "-");

  return finalizeDoc(doc, `discharge-${admission.id}.pdf`);
};

export const generateInvoicePdf = async (invoice, patient) => {
  const doc = new PDFDocument({ margin: 50 });
  header(doc, `Invoice #${invoice.id.slice(-8).toUpperCase()}`);

  doc.fontSize(11);
  doc.text(`Patient: ${patient.firstName} ${patient.lastName}`);
  doc.text(`Date: ${new Date(invoice.createdAt).toDateString()}`);
  doc.text(`Payment Status: ${invoice.paymentStatus.toUpperCase()}`);
  doc.moveDown();

  const tableTop = doc.y;
  doc.fontSize(10).fillColor("#5b6b67");
  doc.text("Description", 50, tableTop);
  doc.text("Qty", 320, tableTop);
  doc.text("Unit Price", 380, tableTop);
  doc.text("Total", 470, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

  let y = tableTop + 22;
  doc.fillColor("#14211e");
  invoice.items.forEach((item) => {
    doc.text(item.description, 50, y, { width: 260 });
    doc.text(String(item.quantity), 320, y);
    doc.text(item.unitPrice.toFixed(2), 380, y);
    doc.text(item.total.toFixed(2), 470, y);
    y += 20;
  });

  doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke();
  y += 15;
  doc.text(`Subtotal: ${invoice.subtotal.toFixed(2)}`, 380, y);
  y += 16;
  doc.text(`Tax: ${invoice.tax.toFixed(2)}`, 380, y);
  y += 16;
  doc.text(`Discount: -${invoice.discount.toFixed(2)}`, 380, y);
  y += 16;
  doc.fontSize(12).text(`Total: ${invoice.totalAmount.toFixed(2)}`, 380, y);

  return finalizeDoc(doc, `invoice-${invoice.id}.pdf`);
};
