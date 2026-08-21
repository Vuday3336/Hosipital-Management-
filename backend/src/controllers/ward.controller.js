import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { serialize } from "../utils/serialize.js";

export const createWard = asyncHandler(async (req, res) => {
  const ward = await prisma.ward.create({ data: req.body });
  sendSuccess(res, { statusCode: 201, message: "Ward created", data: { ward: serialize(ward) } });
});

export const listWards = asyncHandler(async (req, res) => {
  const wards = await prisma.ward.findMany({ orderBy: { name: "asc" } });
  sendSuccess(res, { data: serialize(wards) });
});

export const createBed = asyncHandler(async (req, res) => {
  const bed = await prisma.bed.create({ data: req.body });
  sendSuccess(res, { statusCode: 201, message: "Bed added", data: { bed: serialize(bed) } });
});

export const listBeds = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.ward) where.wardId = req.query.ward;
  if (req.query.available === "true") where.isOccupied = false;
  const beds = await prisma.bed.findMany({ where, include: { ward: { select: { id: true, name: true, type: true } } } });
  sendSuccess(res, { data: serialize(beds) });
});

export const deleteWard = asyncHandler(async (req, res) => {
  const ward = await prisma.ward.delete({ where: { id: req.params.id } }).catch(() => null);
  if (!ward) throw ApiError.notFound("Ward not found");
  sendSuccess(res, { message: "Ward deleted", data: null });
});
