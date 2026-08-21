import { Ward } from "../models/Ward.js";
import { Bed } from "../models/Bed.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const createWard = asyncHandler(async (req, res) => {
  const ward = await Ward.create(req.body);
  sendSuccess(res, { statusCode: 201, message: "Ward created", data: { ward } });
});

export const listWards = asyncHandler(async (req, res) => {
  const wards = await Ward.find().sort({ name: 1 });
  sendSuccess(res, { data: wards });
});

export const createBed = asyncHandler(async (req, res) => {
  const bed = await Bed.create(req.body);
  sendSuccess(res, { statusCode: 201, message: "Bed added", data: { bed } });
});

export const listBeds = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.ward) filter.ward = req.query.ward;
  if (req.query.available === "true") filter.isOccupied = false;
  const beds = await Bed.find(filter).populate("ward", "name type");
  sendSuccess(res, { data: beds });
});

export const deleteWard = asyncHandler(async (req, res) => {
  const ward = await Ward.findByIdAndDelete(req.params.id);
  if (!ward) throw ApiError.notFound("Ward not found");
  sendSuccess(res, { message: "Ward deleted", data: null });
});
