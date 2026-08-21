import { Patient } from "../models/Patient.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";

export const createPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.create({
    ...req.body,
    registeredBy: req.user.id,
    user: req.user.role === "patient" ? req.user.id : undefined,
  });
  sendSuccess(res, { statusCode: 201, message: "Patient registered", data: { patient } });
});

export const listPatients = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, gender, bloodGroup } = req.query;

  const filter = {};
  if (gender) filter.gender = gender;
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  if (search) filter.$text = { $search: search };

  const [patients, total] = await Promise.all([
    Patient.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Patient.countDocuments(filter),
  ]);

  sendSuccess(res, { data: patients, meta: buildMeta({ page, limit, total }) });
});

export const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate("medicalHistory.doctor");
  if (!patient) throw ApiError.notFound("Patient not found");
  sendSuccess(res, { data: { patient } });
});

export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!patient) throw ApiError.notFound("Patient not found");
  sendSuccess(res, { message: "Patient updated", data: { patient } });
});

export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndDelete(req.params.id);
  if (!patient) throw ApiError.notFound("Patient not found");
  sendSuccess(res, { message: "Patient deleted", data: null });
});

export const addMedicalHistory = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw ApiError.notFound("Patient not found");
  patient.medicalHistory.push(req.body);
  await patient.save();
  sendSuccess(res, { statusCode: 201, message: "Medical history added", data: { patient } });
});

export const getMyPatientProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user.id });
  if (!patient) throw ApiError.notFound("No patient profile linked to this account");
  sendSuccess(res, { data: { patient } });
});
