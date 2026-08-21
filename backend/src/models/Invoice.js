import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["consultation", "medicine", "room", "lab", "procedure", "other"],
      default: "other",
    },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
    admission: { type: mongoose.Schema.Types.ObjectId, ref: "Admission", default: null },
    items: { type: [invoiceItemSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    paymentStatus: { type: String, enum: ["unpaid", "partial", "paid"], default: "unpaid" },
    paymentMethod: { type: String, enum: ["cash", "card", "insurance", "upi", "other"], default: null },
    dueDate: { type: Date },
    pdfUrl: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);
