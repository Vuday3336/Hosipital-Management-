import { Notification } from "../models/Notification.js";

export const notifyUser = async ({ userId, type, title, message, relatedEntity }) => {
  return Notification.create({
    user: userId,
    type,
    title,
    message,
    relatedEntity,
  });
};

export const notifyUsers = async (userIds, payload) =>
  Promise.all(userIds.map((userId) => notifyUser({ ...payload, userId })));
