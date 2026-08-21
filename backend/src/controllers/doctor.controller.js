import { prisma } from "../config/db.js";
import { createUser } from "../services/auth.service.js";
import { sendWelcomeEmail } from "../services/email.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";
import { serialize, publicUserSelect } from "../utils/serialize.js";

export const createDoctor = asyncHandler(async (req, res) => {
  const { name, email, password, phone, department, specialization, qualifications, experienceYears, consultationFee, schedule } = req.body;

  const user = await createUser({ name, email, password, role: "doctor", phone });
  const doctor = await prisma.doctor.create({
    data: {
      userId: user.id,
      departmentId: department,
      specialization,
      qualifications: qualifications || [],
      experienceYears,
      consultationFee,
      schedule: schedule || [],
    },
    include: { user: { select: publicUserSelect }, department: true },
  });

  sendWelcomeEmail(user.email, user.name).catch(() => {});
  sendSuccess(res, { statusCode: 201, message: "Doctor added", data: { doctor: serialize(doctor) } });
});

export const listDoctors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { department, specialization, search } = req.query;

  const where = {};
  if (department) where.departmentId = department;
  if (specialization) where.specialization = { contains: specialization, mode: "insensitive" };
  if (search) where.user = { name: { contains: search, mode: "insensitive" } };

  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      include: { user: { select: publicUserSelect }, department: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.doctor.count({ where }),
  ]);

  sendSuccess(res, { data: serialize(doctors), meta: buildMeta({ page, limit, total }) });
});

export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: req.params.id },
    include: { user: { select: publicUserSelect }, department: true },
  });
  if (!doctor) throw ApiError.notFound("Doctor not found");
  sendSuccess(res, { data: { doctor: serialize(doctor) } });
});

export const updateDoctor = asyncHandler(async (req, res) => {
  const { department, ...rest } = req.body;
  const doctor = await prisma.doctor
    .update({
      where: { id: req.params.id },
      data: { ...rest, ...(department ? { departmentId: department } : {}) },
      include: { user: { select: publicUserSelect }, department: true },
    })
    .catch(() => null);
  if (!doctor) throw ApiError.notFound("Doctor not found");
  sendSuccess(res, { message: "Doctor updated", data: { doctor: serialize(doctor) } });
});

export const setSchedule = asyncHandler(async (req, res) => {
  const doctor = await prisma.doctor
    .update({ where: { id: req.params.id }, data: { schedule: req.body.schedule } })
    .catch(() => null);
  if (!doctor) throw ApiError.notFound("Doctor not found");
  sendSuccess(res, { message: "Schedule updated", data: { doctor: serialize(doctor) } });
});

export const deactivateDoctor = asyncHandler(async (req, res) => {
  const doctor = await prisma.doctor.findUnique({ where: { id: req.params.id } });
  if (!doctor) throw ApiError.notFound("Doctor not found");
  await prisma.$transaction([
    prisma.user.update({ where: { id: doctor.userId }, data: { isActive: false } }),
    prisma.doctor.update({ where: { id: doctor.id }, data: { isAvailable: false } }),
  ]);
  sendSuccess(res, { message: "Doctor deactivated", data: null });
});

export const getMyDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id }, include: { department: true } });
  if (!doctor) throw ApiError.notFound("No doctor profile linked to this account");
  sendSuccess(res, { data: { doctor: serialize(doctor) } });
});
