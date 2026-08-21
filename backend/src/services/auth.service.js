import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
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

export const createUser = async ({ name, email, password, role, phone }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role, phone });
  return user;
};

export const issueTokenPair = async (user, userAgent) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({
    tokenHash: hashToken(refreshToken),
    userAgent,
    expiresAt: refreshExpiryDate(),
  });
  // Cap stored sessions per user so the array can't grow unbounded.
  if (user.refreshTokens.length > MAX_REFRESH_TOKENS_PER_USER) {
    user.refreshTokens = user.refreshTokens.slice(-MAX_REFRESH_TOKENS_PER_USER);
  }
  await user.save();

  return { accessToken, refreshToken };
};

export const authenticate = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const valid = await user.comparePassword(password);
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

  const user = await User.findById(payload.sub).select("+refreshTokens");
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Account not found or disabled");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = user.refreshTokens.find((t) => t.tokenHash === tokenHash);
  if (!stored || stored.expiresAt < new Date()) {
    // Reused/unknown token — revoke every session as a precaution.
    user.refreshTokens = [];
    await user.save();
    throw ApiError.unauthorized("Refresh token no longer valid, please log in again");
  }

  // Rotate: drop the used token, issue a fresh pair.
  user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== tokenHash);
  await user.save();

  return issueTokenPair(user, stored.userAgent);
};

export const revokeRefreshToken = async (userId, refreshToken) => {
  const user = await User.findById(userId).select("+refreshTokens");
  if (!user) return;
  const tokenHash = hashToken(refreshToken);
  user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== tokenHash);
  await user.save();
};

export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal whether the email exists.
    return null;
  }
  const rawToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetTokenHash = hashToken(rawToken);
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();
  return { user, rawToken };
};

export const resetPassword = async (rawToken, newPassword) => {
  const tokenHash = hashToken(rawToken);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires +refreshTokens");

  if (!user) {
    throw ApiError.badRequest("Reset token is invalid or has expired");
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // force re-login everywhere
  await user.save();
  return user;
};
