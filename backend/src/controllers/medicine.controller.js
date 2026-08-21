import { Medicine } from "../models/Medicine.js";
import { DispensingLog } from "../models/DispensingLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";
import * as pharmacyService from "../services/pharmacy.service.js";

export const createMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.create(req.body);
  sendSuccess(res, { statusCode: 201, message: "Medicine added", data: { medicine } });
});

export const listMedicines = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, lowStock } = req.query;

  const filter = {};
  if (search) filter.$text = { $search: search };
  if (lowStock === "true") filter.$expr = { $lte: ["$stockQuantity", "$reorderLevel"] };

  const [medicines, total] = await Promise.all([
    Medicine.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Medicine.countDocuments(filter),
  ]);

  sendSuccess(res, { data: medicines, meta: buildMeta({ page, limit, total }) });
});

export const getMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) throw ApiError.notFound("Medicine not found");
  sendSuccess(res, { data: { medicine } });
});

export const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!medicine) throw ApiError.notFound("Medicine not found");
  sendSuccess(res, { message: "Medicine updated", data: { medicine } });
});

export const adjustStock = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) throw ApiError.notFound("Medicine not found");

  const newQty = medicine.stockQuantity + req.body.delta;
  if (newQty < 0) throw ApiError.badRequest("Stock cannot go below zero");
  medicine.stockQuantity = newQty;
  await medicine.save();

  if (medicine.stockQuantity <= medicine.reorderLevel) {
    await pharmacyService.alertLowStock([medicine]);
  }

  sendSuccess(res, { message: "Stock adjusted", data: { medicine } });
});

export const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findByIdAndDelete(req.params.id);
  if (!medicine) throw ApiError.notFound("Medicine not found");
  sendSuccess(res, { message: "Medicine deleted", data: null });
});

export const dispense = asyncHandler(async (req, res) => {
  const result = await pharmacyService.dispenseMedicine({ ...req.body, dispensedBy: req.user.id });
  sendSuccess(res, { statusCode: 201, message: "Medicine dispensed", data: result });
});

export const listDispensingLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.patient) filter.patient = req.query.patient;
  if (req.query.medicine) filter.medicine = req.query.medicine;

  const [logs, total] = await Promise.all([
    DispensingLog.find(filter)
      .populate("medicine", "name unit")
      .populate("patient", "firstName lastName")
      .populate("dispensedBy", "name")
      .sort({ dispensedAt: -1 })
      .skip(skip)
      .limit(limit),
    DispensingLog.countDocuments(filter),
  ]);

  sendSuccess(res, { data: logs, meta: buildMeta({ page, limit, total }) });
});
