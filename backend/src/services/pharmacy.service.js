import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { notifyUser } from "./notification.service.js";
import { sendLowStockEmail } from "./email.service.js";

export const dispenseMedicine = async ({ medicine, patient, prescription, quantity, dispensedBy }) => {
  const medicineDoc = await prisma.medicine.findUnique({ where: { id: medicine } });
  if (!medicineDoc) throw ApiError.notFound("Medicine not found");
  if (medicineDoc.stockQuantity < quantity) {
    throw ApiError.badRequest(`Insufficient stock: only ${medicineDoc.stockQuantity} ${medicineDoc.unit}(s) left`);
  }

  const updatedMedicine = await prisma.medicine.update({
    where: { id: medicine },
    data: { stockQuantity: medicineDoc.stockQuantity - quantity },
  });

  const log = await prisma.dispensingLog.create({
    data: { medicineId: medicine, patientId: patient, prescriptionId: prescription, quantity, dispensedById: dispensedBy },
  });

  if (updatedMedicine.stockQuantity <= updatedMedicine.reorderLevel) {
    await alertLowStock([updatedMedicine]);
  }

  return { log, medicine: updatedMedicine };
};

export const alertLowStock = async (medicines) => {
  const admins = await prisma.user.findMany({ where: { role: "admin", isActive: true } });
  await Promise.all(
    admins.map((admin) =>
      notifyUser({
        userId: admin.id,
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

// Postgres has no direct equivalent of Mongo's $expr field-to-field comparison
// in a `where` filter — at this app's scale (dozens to low hundreds of
// medicines), filtering in JS after a plain findMany is simpler and safer
// than a raw SQL query for what's a rarely-hot-path lookup.
export const findLowStockMedicines = async () => {
  const medicines = await prisma.medicine.findMany();
  return medicines.filter((m) => m.stockQuantity <= m.reorderLevel);
};
