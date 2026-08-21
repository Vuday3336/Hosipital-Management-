import { Department } from "../models/Department.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);
  sendSuccess(res, { statusCode: 201, message: "Department created", data: { department } });
});

export const listDepartments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = req.query.search ? { name: new RegExp(req.query.search, "i") } : {};
  const [departments, total] = await Promise.all([
    Department.find(filter).populate("headDoctor").sort({ name: 1 }).skip(skip).limit(limit),
    Department.countDocuments(filter),
  ]);
  sendSuccess(res, { data: departments, meta: buildMeta({ page, limit, total }) });
});

export const getDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id).populate("headDoctor");
  if (!department) throw ApiError.notFound("Department not found");
  sendSuccess(res, { data: { department } });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!department) throw ApiError.notFound("Department not found");
  sendSuccess(res, { message: "Department updated", data: { department } });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) throw ApiError.notFound("Department not found");
  sendSuccess(res, { message: "Department deleted", data: null });
});
