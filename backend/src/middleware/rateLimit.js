import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const authRateLimiter = rateLimit({
  windowMs: env.authRateLimit.windowMin * 60 * 1000,
  max: env.authRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Too many attempts. Please try again later.",
    error: { details: null },
  },
});
