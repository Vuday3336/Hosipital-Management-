import { prisma } from "../config/db.js";

export const notifyUser = async ({ userId, type, title, message, relatedEntity }) => {
  return prisma.notification.create({
    data: { userId, type, title, message, relatedEntity: relatedEntity ?? undefined },
  });
};

export const notifyUsers = async (userIds, payload) =>
  Promise.all(userIds.map((userId) => notifyUser({ ...payload, userId })));
