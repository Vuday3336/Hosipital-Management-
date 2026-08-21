import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    category: { type: String, trim: true },
    manufacturer: { type: String, trim: true },
    unit: { type: String, default: "tablet" },
    stockQuantity: { type: Number, required: true, default: 0, min: 0 },
    reorderLevel: { type: Number, required: true, default: 20 },
    unitPrice: { type: Number, required: true, default: 0 },
    batchNumber: { type: String, trim: true },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

medicineSchema.index({ name: "text", genericName: "text" });
medicineSchema.virtual("isLowStock").get(function () {
  return this.stockQuantity <= this.reorderLevel;
});
medicineSchema.set("toJSON", { virtuals: true });

export const Medicine = mongoose.model("Medicine", medicineSchema);
