import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.isApiError ? err.statusCode : 500;
  let message = err.message || "Internal server error";
  let details = err.details;

  if (err.name === "ValidationError") {
    // Mongoose validation error
    statusCode = 400;
    details = Object.values(err.errors).map((e) => e.message);
    message = "Validation failed";
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : "Duplicate value";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired token";
  }

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    error: {
      details: details ?? null,
      ...(env.nodeEnv === "development" ? { stack: err.stack } : {}),
    },
  });
};
