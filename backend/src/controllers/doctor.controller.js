import { Doctor } from "../models/Doctor.js";
import { User } from "../models/User.js";
import { createUser } from "../services/auth.service.js";
import { sendWelcomeEmail } from "../services/email.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";

export const createDoctor = asyncHandler(async (req, res) => {
  const { name, email, password, phone, department, specialization, qualifications, experienceYears, consultationFee, schedule } = req.body;

  const user = await createUser({ name, email, password, role: "doctor", phone });
  const doctor = await Doctor.create({
    user: user._id,
    department,
    specialization,
    qualifications,
    experienceYears,
    consultationFee,
    schedule,
  });

  sendWelcomeEmail(user.email, user.name).catch(() => {});
  const populated = await doctor.populate(["user", "department"]);
  sendSuccess(res, { statusCode: 201, message: "Doctor added", data: { doctor: populated } });
});

export const listDoctors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { department, specialization, search } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (specialization) filter.specialization = new RegExp(specialization, "i");

  let query = Doctor.find(filter).populate("user", "name email phone avatarUrl isActive").populate("department", "name");

  if (search) {
    query = query.populate({
      path: "user",
      match: { name: new RegExp(search, "i") },
    });
  }

  const [doctorsRaw, total] = await Promise.all([
    query.sort({ createdAt: -1 }).skip(skip).limit(limit),
    Doctor.countDocuments(filter),
  ]);

  const doctors = search ? doctorsRaw.filter((d) => d.user) : doctorsRaw;
  sendSuccess(res, { data: doctors, meta: buildMeta({ page, limit, total }) });
});

export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate("user", "-passwordHash").populate("department");
  if (!doctor) throw ApiError.notFound("Doctor not found");
  sendSuccess(res, { data: { doctor } });
});

export const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate(["user", "department"]);
  if (!doctor) throw ApiError.notFound("Doctor not found");
  sendSuccess(res, { message: "Doctor updated", data: { doctor } });
});

export const setSchedule = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { schedule: req.body.schedule },
    { new: true, runValidators: true }
  );
  if (!doctor) throw ApiError.notFound("Doctor not found");
  sendSuccess(res, { message: "Schedule updated", data: { doctor } });
});

export const deactivateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw ApiError.notFound("Doctor not found");
  await User.findByIdAndUpdate(doctor.user, { isActive: false });
  doctor.isAvailable = false;
  await doctor.save();
  sendSuccess(res, { message: "Doctor deactivated", data: null });
});

export const getMyDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user.id }).populate("department");
  if (!doctor) throw ApiError.notFound("No doctor profile linked to this account");
  sendSuccess(res, { data: { doctor } });
});
