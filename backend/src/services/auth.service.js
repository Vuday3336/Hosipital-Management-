import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshExpiryDate,
} from "../utils/tokens.js";

const SALT_ROUNDS = 12;
const MAX_REFRESH_TOKENS_PER_USER = 5;

// toSafeObject() was a Mongoose instance method — there are no model instances
// with Prisma, so this is now a plain function used everywhere a controller
// used to call `user.toSafeObject()`.
export const toSafeUser = (user) => ({
  _id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

export const comparePassword = (user, candidate) => bcrypt.compare(candidate, user.passwordHash);

export const createUser = async ({ name, email, password, role, phone }) => {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return prisma.user.create({ data: { name, email: email.toLowerCase(), passwordHash, role, phone } });
};

export const issueTokenPair = async (user, userAgent) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  // A single INSERT is naturally atomic — no fetch-then-save race like the old
  // Mongoose array-push version had (see rotateRefreshToken below for the fix
  // that was needed there).
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(refreshToken), userAgent, expiresAt: refreshExpiryDate() },
  });

  // Cap stored sessions per user so the table can't grow unbounded: delete
  // everything past the N most recent for this user.
  const stale = await prisma.refreshToken.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    skip: MAX_REFRESH_TOKENS_PER_USER,
    select: { id: true },
  });
  if (stale.length) {
    await prisma.refreshToken.deleteMany({ where: { id: { in: stale.map((t) => t.id) } } });
  }

  return { accessToken, refreshToken };
};

export const authenticate = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const valid = await comparePassword(user, password);
  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  return user;
};

export const rotateRefreshToken = async (refreshToken) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const tokenHash = hashToken(refreshToken);

  // Atomic find-and-remove in one statement: `deleteMany` + `returning` isn't
  // available in Prisma, so this uses a raw DELETE ... RETURNING, which is
  // atomic at the row level in Postgres — a concurrent request for the same
  // (already-rotated) token simply finds nothing to delete, exactly mirroring
  // the Mongo `findOneAndUpdate` fix this replaces.
  const deleted = await prisma.$queryRaw`
    DELETE FROM "RefreshToken" WHERE "tokenHash" = ${tokenHash} RETURNING *
  `;
  const stored = deleted[0];

  if (!stored) {
    throw ApiError.unauthorized("Refresh token no longer valid, please log in again");
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || !user.isActive || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token no longer valid, please log in again");
  }

  return issueTokenPair(user, stored.userAgent);
};

export const revokeRefreshToken = async (userId, refreshToken) => {
  await prisma.refreshToken.deleteMany({ where: { userId, tokenHash: hashToken(refreshToken) } });
};

export const requestPasswordReset = async (email) => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    // Don't reveal whether the email exists.
    return null;
  }
  const rawToken = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: hashToken(rawToken),
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });
  return { user, rawToken };
};

export const resetPassword = async (rawToken, newPassword) => {
  const tokenHash = hashToken(rawToken);
  const user = await prisma.user.findFirst({
    where: { passwordResetTokenHash: tokenHash, passwordResetExpires: { gt: new Date() } },
  });

  if (!user) {
    throw ApiError.badRequest("Reset token is invalid or has expired");
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetTokenHash: null, passwordResetExpires: null },
    }),
    prisma.refreshToken.deleteMany({ where: { userId: user.id } }), // force re-login everywhere
  ]);
  return user;
};
