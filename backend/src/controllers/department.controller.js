import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";
import { serialize, publicUserSelect } from "../utils/serialize.js";

const headDoctorInclude = { headDoctor: { include: { user: { select: publicUserSelect } } } };

export const createDepartment = asyncHandler(async (req, res) => {
  const { headDoctor, ...rest } = req.body;
  const department = await prisma.department.create({
    data: { ...rest, headDoctorId: headDoctor },
    include: headDoctorInclude,
  });
  sendSuccess(res, { statusCode: 201, message: "Department created", data: { department: serialize(department) } });
});

export const listDepartments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const where = req.query.search ? { name: { contains: req.query.search, mode: "insensitive" } } : {};
  const [departments, total] = await Promise.all([
    prisma.department.findMany({ where, include: headDoctorInclude, orderBy: { name: "asc" }, skip, take: limit }),
    prisma.department.count({ where }),
  ]);
  sendSuccess(res, { data: serialize(departments), meta: buildMeta({ page, limit, total }) });
});

export const getDepartment = asyncHandler(async (req, res) => {
  const department = await prisma.department.findUnique({ where: { id: req.params.id }, include: headDoctorInclude });
  if (!department) throw ApiError.notFound("Department not found");
  sendSuccess(res, { data: { department: serialize(department) } });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const { headDoctor, ...rest } = req.body;
  const department = await prisma.department
    .update({
      where: { id: req.params.id },
      data: { ...rest, ...(headDoctor !== undefined ? { headDoctorId: headDoctor } : {}) },
      include: headDoctorInclude,
    })
    .catch(() => null);
  if (!department) throw ApiError.notFound("Department not found");
  sendSuccess(res, { message: "Department updated", data: { department: serialize(department) } });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await prisma.department.delete({ where: { id: req.params.id } }).catch(() => null);
  if (!department) throw ApiError.notFound("Department not found");
  sendSuccess(res, { message: "Department deleted", data: null });
});
