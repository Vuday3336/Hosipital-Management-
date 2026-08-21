import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw ApiError.unauthorized("Authentication token missing");
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired access token");
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Account not found or disabled");
  }

  req.user = { id: user._id.toString(), role: user.role, email: user.email, name: user.name };
  next();
});
