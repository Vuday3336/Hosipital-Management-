import { Admission } from "../models/Admission.js";
import { Bed } from "../models/Bed.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";
import { generateDischargeSummaryPdf } from "../services/pdf.service.js";

export const createAdmission = asyncHandler(async (req, res) => {
  const { patient, attendingDoctor, ward, bed, reasonForAdmission } = req.body;

  const bedDoc = await Bed.findById(bed);
  if (!bedDoc) throw ApiError.notFound("Bed not found");
  if (bedDoc.isOccupied) throw ApiError.conflict("Selected bed is already occupied");

  const admission = await Admission.create({
    patient,
    attendingDoctor,
    ward,
    bed,
    reasonForAdmission,
  });

  bedDoc.isOccupied = true;
  bedDoc.currentAdmission = admission._id;
  await bedDoc.save();

  sendSuccess(res, { statusCode: 201, message: "Patient admitted", data: { admission } });
});

export const listAdmissions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.patient) filter.patient = req.query.patient;

  const [admissions, total] = await Promise.all([
    Admission.find(filter)
      .populate("patient", "firstName lastName")
      .populate({ path: "attendingDoctor", populate: "user" })
      .populate("ward", "name type")
      .populate("bed", "bedNumber")
      .sort({ admissionDate: -1 })
      .skip(skip)
      .limit(limit),
    Admission.countDocuments(filter),
  ]);

  sendSuccess(res, { data: admissions, meta: buildMeta({ page, limit, total }) });
});

export const getAdmission = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id)
    .populate("patient")
    .populate({ path: "attendingDoctor", populate: "user" })
    .populate("ward")
    .populate("bed");
  if (!admission) throw ApiError.notFound("Admission not found");
  sendSuccess(res, { data: { admission } });
});

export const dischargePatient = asyncHandler(async (req, res) => {
  const admission = await Admission.findById(req.params.id)
    .populate("patient")
    .populate({ path: "attendingDoctor", populate: "user" });
  if (!admission) throw ApiError.notFound("Admission not found");
  if (admission.status === "discharged") throw ApiError.badRequest("Patient already discharged");

  admission.status = "discharged";
  admission.dischargeDate = new Date();
  admission.dischargeSummary = {
    summary: req.body.summary,
    followUpInstructions: req.body.followUpInstructions,
    generatedAt: new Date(),
  };

  const pdfUrl = await generateDischargeSummaryPdf(admission, admission.patient, admission.attendingDoctor);
  admission.dischargeSummary.pdfUrl = pdfUrl;
  await admission.save();

  await Bed.findByIdAndUpdate(admission.bed, { isOccupied: false, currentAdmission: null });

  sendSuccess(res, { message: "Patient discharged", data: { admission } });
});
