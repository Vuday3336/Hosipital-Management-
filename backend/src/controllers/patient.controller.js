import crypto from "crypto";
import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";
import { serialize } from "../utils/serialize.js";

export const createPatient = asyncHandler(async (req, res) => {
  const { allergies, ...body } = req.body;
  const patient = await prisma.patient.create({
    data: {
      ...body,
      allergies: allergies || [],
      registeredById: req.user.id,
      userId: req.user.role === "patient" ? req.user.id : undefined,
    },
  });
  sendSuccess(res, { statusCode: 201, message: "Patient registered", data: { patient: serialize(patient) } });
});

export const listPatients = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, gender, bloodGroup } = req.query;

  const where = {};
  if (gender) where.gender = gender;
  if (bloodGroup) where.bloodGroup = bloodGroup;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.patient.count({ where }),
  ]);

  sendSuccess(res, { data: serialize(patients), meta: buildMeta({ page, limit, total }) });
});

export const getPatient = asyncHandler(async (req, res) => {
  const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
  if (!patient) throw ApiError.notFound("Patient not found");
  sendSuccess(res, { data: { patient: serialize(patient) } });
});

export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await prisma.patient
    .update({ where: { id: req.params.id }, data: req.body })
    .catch(() => null);
  if (!patient) throw ApiError.notFound("Patient not found");
  sendSuccess(res, { message: "Patient updated", data: { patient: serialize(patient) } });
});

export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await prisma.patient.delete({ where: { id: req.params.id } }).catch(() => null);
  if (!patient) throw ApiError.notFound("Patient not found");
  sendSuccess(res, { message: "Patient deleted", data: null });
});

export const addMedicalHistory = asyncHandler(async (req, res) => {
  const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
  if (!patient) throw ApiError.notFound("Patient not found");

  const entry = { _id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...req.body };
  const updated = await prisma.patient.update({
    where: { id: req.params.id },
    data: { medicalHistory: [...patient.medicalHistory, entry] },
  });
  sendSuccess(res, { statusCode: 201, message: "Medical history added", data: { patient: serialize(updated) } });
});

export const getMyPatientProfile = asyncHandler(async (req, res) => {
  const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
  if (!patient) throw ApiError.notFound("No patient profile linked to this account");
  sendSuccess(res, { data: { patient: serialize(patient) } });
});

export const updateMyPatientProfile = asyncHandler(async (req, res) => {
  const patient = await prisma.patient
    .update({ where: { userId: req.user.id }, data: req.body })
    .catch(() => null);
  if (!patient) throw ApiError.notFound("No patient profile linked to this account");
  sendSuccess(res, { message: "Profile updated", data: { patient: serialize(patient) } });
});
