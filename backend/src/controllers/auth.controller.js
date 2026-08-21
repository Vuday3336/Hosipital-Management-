import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import {
  createUser,
  issueTokenPair,
  authenticate,
  rotateRefreshToken,
  revokeRefreshToken,
  requestPasswordReset,
  resetPassword as resetPasswordService,
} from "../services/auth.service.js";
import { User } from "../models/User.js";
import { Patient } from "../models/Patient.js";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../services/email.service.js";

const splitName = (name) => {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") || firstName };
};

const REFRESH_COOKIE = "refreshToken";

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: env.nodeEnv === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const setRefreshCookie = (res, token) => res.cookie(REFRESH_COOKIE, token, cookieOptions());
const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const user = await createUser({ name, email, password, role: "patient", phone });

  // Every patient needs a Patient profile to book appointments, view records, and see
  // bills — self-registration creates a minimal stub; dob/gender get filled in later.
  await Patient.create({ ...splitName(name), user: user._id, phone, email: user.email, registeredBy: user._id });

  const { accessToken, refreshToken } = await issueTokenPair(user, req.headers["user-agent"]);
  setRefreshCookie(res, refreshToken);
  sendWelcomeEmail(user.email, user.name).catch(() => {});
  sendSuccess(res, {
    statusCode: 201,
    message: "Account created",
    data: { user: user.toSafeObject(), accessToken },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await authenticate(email, password);
  const { accessToken, refreshToken } = await issueTokenPair(user, req.headers["user-agent"]);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, { message: "Logged in", data: { user: user.toSafeObject(), accessToken } });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized("No refresh token provided");

  const { accessToken, refreshToken } = await rotateRefreshToken(token);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, { message: "Token refreshed", data: { accessToken } });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token && req.user) {
    await revokeRefreshToken(req.user.id, token);
  }
  clearRefreshCookie(res);
  sendSuccess(res, { message: "Logged out", data: null });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound("User not found");
  sendSuccess(res, { data: { user: user.toSafeObject() } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await requestPasswordReset(email);
  if (result) {
    sendPasswordResetEmail(result.user.email, result.rawToken).catch(() => {});
  }
  // Always respond the same way whether or not the email exists.
  sendSuccess(res, { message: "If that email exists, a reset link has been sent", data: null });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  await resetPasswordService(token, password);
  sendSuccess(res, { message: "Password has been reset, please log in", data: null });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select("+passwordHash +refreshTokens");
  if (!user) throw ApiError.notFound("User not found");

  const valid = await user.comparePassword(currentPassword);
  if (!valid) throw ApiError.badRequest("Current password is incorrect");

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.refreshTokens = [];
  await user.save();
  clearRefreshCookie(res);
  sendSuccess(res, { message: "Password changed, please log in again", data: null });
});
