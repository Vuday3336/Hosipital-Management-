import { User } from "../models/User.js";
import { createUser } from "../services/auth.service.js";
import { sendWelcomeEmail } from "../services/email.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";

export const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  const user = await createUser({ name, email, password, role, phone });
  sendWelcomeEmail(user.email, user.name).catch(() => {});
  sendSuccess(res, { statusCode: 201, message: "Staff account created", data: { user: user.toSafeObject() } });
});

export const listStaff = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { role, search } = req.query;
  const filter = { role: { $in: ["admin", "receptionist"] } };
  if (role) filter.role = role;
  if (search) filter.name = new RegExp(search, "i");

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  sendSuccess(res, { data: users.map((u) => u.toSafeObject()), meta: buildMeta({ page, limit, total }) });
});

export const setStaffActive = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, { message: "Status updated", data: { user: user.toSafeObject() } });
});
