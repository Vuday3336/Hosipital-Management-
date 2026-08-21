import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";
import { serialize, publicUserSelect } from "../utils/serialize.js";

const doctorWithUser = { doctor: { include: { user: { select: publicUserSelect } } } };
const patientBasic = { patient: { select: { id: true, firstName: true, lastName: true } } };

export const createPrescription = asyncHandler(async (req, res) => {
  const doctorDoc = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
  if (!doctorDoc) throw ApiError.forbidden("No doctor profile linked to this account");

  const { appointment, patient, diagnosis, medicines, notes } = req.body;
  const prescription = await prisma.prescription.create({
    data: { appointmentId: appointment, patientId: patient, doctorId: doctorDoc.id, diagnosis, medicines, notes },
  });
  sendSuccess(res, { statusCode: 201, message: "Prescription created", data: { prescription: serialize(prescription) } });
});

export const listPrescriptions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const where = {};

  // Fail closed: a missing linked profile must return nothing, not everyone's records.
  if (req.user.role === "doctor") {
    const doctorDoc = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
    if (!doctorDoc) return sendSuccess(res, { data: [], meta: buildMeta({ page, limit, total: 0 }) });
    where.doctorId = doctorDoc.id;
  } else if (req.user.role === "patient") {
    const patientDoc = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patientDoc) return sendSuccess(res, { data: [], meta: buildMeta({ page, limit, total: 0 }) });
    where.patientId = patientDoc.id;
  } else if (req.query.patient) {
    where.patientId = req.query.patient;
  }

  const [prescriptions, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      include: { ...doctorWithUser, ...patientBasic },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.prescription.count({ where }),
  ]);

  sendSuccess(res, { data: serialize(prescriptions), meta: buildMeta({ page, limit, total }) });
});

export const getPrescription = asyncHandler(async (req, res) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: req.params.id },
    include: { ...doctorWithUser, patient: true },
  });
  if (!prescription) throw ApiError.notFound("Prescription not found");
  sendSuccess(res, { data: { prescription: serialize(prescription) } });
});
