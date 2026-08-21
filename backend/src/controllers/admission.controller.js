import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";
import { serialize, publicUserSelect } from "../utils/serialize.js";
import { generateDischargeSummaryPdf } from "../services/pdf.service.js";

const fullInclude = {
  patient: true,
  attendingDoctor: { include: { user: { select: publicUserSelect } } },
  ward: true,
  bed: true,
};

export const createAdmission = asyncHandler(async (req, res) => {
  const { patient, attendingDoctor, ward, bed, reasonForAdmission } = req.body;

  const bedDoc = await prisma.bed.findUnique({ where: { id: bed } });
  if (!bedDoc) throw ApiError.notFound("Bed not found");
  if (bedDoc.isOccupied) throw ApiError.conflict("Selected bed is already occupied");

  const admission = await prisma.admission.create({
    data: { patientId: patient, attendingDoctorId: attendingDoctor, wardId: ward, bedId: bed, reasonForAdmission },
  });

  await prisma.bed.update({ where: { id: bed }, data: { isOccupied: true, currentAdmissionId: admission.id } });

  sendSuccess(res, { statusCode: 201, message: "Patient admitted", data: { admission: serialize(admission) } });
});

export const listAdmissions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.patient) where.patientId = req.query.patient;

  const [admissions, total] = await Promise.all([
    prisma.admission.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        attendingDoctor: { include: { user: { select: publicUserSelect } } },
        ward: { select: { id: true, name: true, type: true } },
        bed: { select: { id: true, bedNumber: true } },
      },
      orderBy: { admissionDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.admission.count({ where }),
  ]);

  sendSuccess(res, { data: serialize(admissions), meta: buildMeta({ page, limit, total }) });
});

export const getAdmission = asyncHandler(async (req, res) => {
  const admission = await prisma.admission.findUnique({ where: { id: req.params.id }, include: fullInclude });
  if (!admission) throw ApiError.notFound("Admission not found");
  sendSuccess(res, { data: { admission: serialize(admission) } });
});

export const dischargePatient = asyncHandler(async (req, res) => {
  const admission = await prisma.admission.findUnique({ where: { id: req.params.id }, include: fullInclude });
  if (!admission) throw ApiError.notFound("Admission not found");
  if (admission.status === "discharged") throw ApiError.badRequest("Patient already discharged");

  const dischargeSummary = {
    summary: req.body.summary,
    followUpInstructions: req.body.followUpInstructions,
    generatedAt: new Date().toISOString(),
  };

  const pdfUrl = await generateDischargeSummaryPdf(admission, admission.patient, admission.attendingDoctor);
  dischargeSummary.pdfUrl = pdfUrl;

  const updated = await prisma.admission.update({
    where: { id: admission.id },
    data: { status: "discharged", dischargeDate: new Date(), dischargeSummary },
    include: fullInclude,
  });

  await prisma.bed.update({ where: { id: admission.bedId }, data: { isOccupied: false, currentAdmissionId: null } });

  sendSuccess(res, { message: "Patient discharged", data: { admission: serialize(updated) } });
});
