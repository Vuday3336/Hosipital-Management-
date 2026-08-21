import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";
import { serialize, publicUserSelect } from "../utils/serialize.js";
import * as pharmacyService from "../services/pharmacy.service.js";

export const createMedicine = asyncHandler(async (req, res) => {
  const medicine = await prisma.medicine.create({ data: req.body });
  sendSuccess(res, { statusCode: 201, message: "Medicine added", data: { medicine: serialize(medicine) } });
});

export const listMedicines = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, lowStock } = req.query;

  const where = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { genericName: { contains: search, mode: "insensitive" } }] }
    : {};

  if (lowStock === "true") {
    // Postgres can't compare two columns of the same row in a Prisma `where`
    // filter — fetch and filter in JS (fine at this app's medicine-catalog scale).
    const all = await prisma.medicine.findMany({ where, orderBy: { name: "asc" } });
    const filtered = all.filter((m) => m.stockQuantity <= m.reorderLevel);
    const page_ = filtered.slice(skip, skip + limit);
    return sendSuccess(res, { data: serialize(page_), meta: buildMeta({ page, limit, total: filtered.length }) });
  }

  const [medicines, total] = await Promise.all([
    prisma.medicine.findMany({ where, orderBy: { name: "asc" }, skip, take: limit }),
    prisma.medicine.count({ where }),
  ]);

  sendSuccess(res, { data: serialize(medicines), meta: buildMeta({ page, limit, total }) });
});

export const getMedicine = asyncHandler(async (req, res) => {
  const medicine = await prisma.medicine.findUnique({ where: { id: req.params.id } });
  if (!medicine) throw ApiError.notFound("Medicine not found");
  sendSuccess(res, { data: { medicine: serialize(medicine) } });
});

export const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await prisma.medicine.update({ where: { id: req.params.id }, data: req.body }).catch(() => null);
  if (!medicine) throw ApiError.notFound("Medicine not found");
  sendSuccess(res, { message: "Medicine updated", data: { medicine: serialize(medicine) } });
});

export const adjustStock = asyncHandler(async (req, res) => {
  const medicine = await prisma.medicine.findUnique({ where: { id: req.params.id } });
  if (!medicine) throw ApiError.notFound("Medicine not found");

  const newQty = medicine.stockQuantity + req.body.delta;
  if (newQty < 0) throw ApiError.badRequest("Stock cannot go below zero");
  const updated = await prisma.medicine.update({ where: { id: req.params.id }, data: { stockQuantity: newQty } });

  if (updated.stockQuantity <= updated.reorderLevel) {
    await pharmacyService.alertLowStock([updated]);
  }

  sendSuccess(res, { message: "Stock adjusted", data: { medicine: serialize(updated) } });
});

export const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await prisma.medicine.delete({ where: { id: req.params.id } }).catch(() => null);
  if (!medicine) throw ApiError.notFound("Medicine not found");
  sendSuccess(res, { message: "Medicine deleted", data: null });
});

export const dispense = asyncHandler(async (req, res) => {
  const result = await pharmacyService.dispenseMedicine({ ...req.body, dispensedBy: req.user.id });
  sendSuccess(res, { statusCode: 201, message: "Medicine dispensed", data: serialize(result) });
});

const dispensingLogInclude = {
  medicine: { select: { id: true, name: true, unit: true } },
  patient: { select: { id: true, firstName: true, lastName: true } },
  dispensedBy: { select: publicUserSelect },
};

export const listDispensingLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const where = {};
  if (req.query.patient) where.patientId = req.query.patient;
  if (req.query.medicine) where.medicineId = req.query.medicine;

  const [logs, total] = await Promise.all([
    prisma.dispensingLog.findMany({ where, include: dispensingLogInclude, orderBy: { dispensedAt: "desc" }, skip, take: limit }),
    prisma.dispensingLog.count({ where }),
  ]);

  sendSuccess(res, { data: serialize(logs), meta: buildMeta({ page, limit, total }) });
});

export const listMyDispensingLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const patientDoc = await prisma.patient.findUnique({ where: { userId: req.user.id } });
  if (!patientDoc) return sendSuccess(res, { data: [], meta: buildMeta({ page, limit, total: 0 }) });

  const where = { patientId: patientDoc.id };
  const [logs, total] = await Promise.all([
    prisma.dispensingLog.findMany({
      where,
      include: { medicine: { select: { id: true, name: true, unit: true } }, dispensedBy: { select: publicUserSelect } },
      orderBy: { dispensedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.dispensingLog.count({ where }),
  ]);

  sendSuccess(res, { data: serialize(logs), meta: buildMeta({ page, limit, total }) });
});
