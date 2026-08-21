import { Medicine } from "../models/Medicine.js";
import { DispensingLog } from "../models/DispensingLog.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { notifyUser } from "./notification.service.js";
import { sendLowStockEmail } from "./email.service.js";

export const dispenseMedicine = async ({ medicine, patient, prescription, quantity, dispensedBy }) => {
  const medicineDoc = await Medicine.findById(medicine);
  if (!medicineDoc) throw ApiError.notFound("Medicine not found");
  if (medicineDoc.stockQuantity < quantity) {
    throw ApiError.badRequest(`Insufficient stock: only ${medicineDoc.stockQuantity} ${medicineDoc.unit}(s) left`);
  }

  medicineDoc.stockQuantity -= quantity;
  await medicineDoc.save();

  const log = await DispensingLog.create({ medicine, patient, prescription, quantity, dispensedBy });

  if (medicineDoc.stockQuantity <= medicineDoc.reorderLevel) {
    await alertLowStock([medicineDoc]);
  }

  return { log, medicine: medicineDoc };
};

export const alertLowStock = async (medicines) => {
  const admins = await User.find({ role: "admin", isActive: true });
  await Promise.all(
    admins.map((admin) =>
      notifyUser({
        userId: admin._id,
        type: "low_stock",
        title: "Low stock alert",
        message: `${medicines.length} medicine(s) at or below reorder level: ${medicines.map((m) => m.name).join(", ")}`,
      })
    )
  );
  if (admins.length) {
    sendLowStockEmail(
      admins.map((a) => a.email),
      medicines
    ).catch(() => {});
  }
};

export const findLowStockMedicines = () =>
  Medicine.find({ $expr: { $lte: ["$stockQuantity", "$reorderLevel"] } });
