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

  // Atomic push+cap via update operators — a fetch-then-save here would race under
  // concurrent requests (two tabs, or React StrictMode's double effect invocation)
  // and throw a Mongoose VersionError when both try to save the same document.
  await User.updateOne(
    { _id: user._id },
    {
      $push: {
        refreshTokens: {
          $each: [{ tokenHash: hashToken(refreshToken), userAgent, expiresAt: refreshExpiryDate() }],
          $slice: -MAX_REFRESH_TOKENS_PER_USER,
        },
      },
    }
  );

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

  const tokenHash = hashToken(refreshToken);

  // Atomically find-and-remove the token in one step: `new: false` returns the
  // document as it was *before* the $pull, so a stored entry that matched is
  // consumed exactly once even if two requests race on the same token (a second,
  // concurrent request for the same token simply finds nothing left to pull).
  const user = await User.findOneAndUpdate(
    { _id: payload.sub, "refreshTokens.tokenHash": tokenHash },
    { $pull: { refreshTokens: { tokenHash } } },
    { new: false }
  ).select("+refreshTokens");

  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Refresh token no longer valid, please log in again");
  }

  const stored = user.refreshTokens.find((t) => t.tokenHash === tokenHash);
  if (!stored || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token no longer valid, please log in again");
  }

  return issueTokenPair(user, stored.userAgent);
};

export const revokeRefreshToken = async (userId, refreshToken) => {
  await User.updateOne({ _id: userId }, { $pull: { refreshTokens: { tokenHash: hashToken(refreshToken) } } });
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
