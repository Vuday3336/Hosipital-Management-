import { prisma } from "../config/db.js";
import { createUser, toSafeUser } from "../services/auth.service.js";
import { sendWelcomeEmail } from "../services/email.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";

export const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  const user = await createUser({ name, email, password, role, phone });
  sendWelcomeEmail(user.email, user.name).catch(() => {});
  sendSuccess(res, { statusCode: 201, message: "Staff account created", data: { user: toSafeUser(user) } });
});

export const listStaff = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { role, search } = req.query;
  const where = { role: role ? role : { in: ["admin", "receptionist"] } };
  if (search) where.name = { contains: search, mode: "insensitive" };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.user.count({ where }),
  ]);
  sendSuccess(res, { data: users.map(toSafeUser), meta: buildMeta({ page, limit, total }) });
});

export const setStaffActive = asyncHandler(async (req, res) => {
  const user = await prisma.user
    .update({ where: { id: req.params.id }, data: { isActive: req.body.isActive } })
    .catch(() => null);
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, { message: "Status updated", data: { user: toSafeUser(user) } });
});
