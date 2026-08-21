import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildMeta } from "../utils/paginate.js";
import { serialize } from "../utils/serialize.js";

export const listMyNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const where = { userId: req.user.id };
  if (req.query.unread === "true") where.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
  ]);

  sendSuccess(res, { data: serialize(notifications), meta: { ...buildMeta({ page, limit, total }), unreadCount } });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { count } = await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: { isRead: true },
  });
  if (!count) throw ApiError.notFound("Notification not found");
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  sendSuccess(res, { message: "Marked as read", data: { notification: serialize(notification) } });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  sendSuccess(res, { message: "All notifications marked as read", data: null });
});
