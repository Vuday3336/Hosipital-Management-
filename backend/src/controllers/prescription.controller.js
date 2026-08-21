import { Prescription } from "../models/Prescription.js";
import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";

export const createPrescription = asyncHandler(async (req, res) => {
  const doctorDoc = await Doctor.findOne({ user: req.user.id });
  if (!doctorDoc) throw ApiError.forbidden("No doctor profile linked to this account");

  const prescription = await Prescription.create({ ...req.body, doctor: doctorDoc._id });
  sendSuccess(res, { statusCode: 201, message: "Prescription created", data: { prescription } });
});

export const listPrescriptions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  // Fail closed: an unset filter key is dropped by the driver and would otherwise
  // return every record in the hospital to a caller with no linked profile yet.
  if (req.user.role === "doctor") {
    const doctorDoc = await Doctor.findOne({ user: req.user.id });
    if (!doctorDoc) return sendSuccess(res, { data: [], meta: buildMeta({ page, limit, total: 0 }) });
    filter.doctor = doctorDoc._id;
  } else if (req.user.role === "patient") {
    const patientDoc = await Patient.findOne({ user: req.user.id });
    if (!patientDoc) return sendSuccess(res, { data: [], meta: buildMeta({ page, limit, total: 0 }) });
    filter.patient = patientDoc._id;
  } else if (req.query.patient) {
    filter.patient = req.query.patient;
  }

  const [prescriptions, total] = await Promise.all([
    Prescription.find(filter)
      .populate({ path: "doctor", populate: "user" })
      .populate("patient", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Prescription.countDocuments(filter),
  ]);

  sendSuccess(res, { data: prescriptions, meta: buildMeta({ page, limit, total }) });
});

export const getPrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate({ path: "doctor", populate: "user" })
    .populate("patient");
  if (!prescription) throw ApiError.notFound("Prescription not found");
  sendSuccess(res, { data: { prescription } });
});
