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

  if (err.code === "P2002") {
    // Prisma unique constraint violation
    statusCode = 409;
    const field = err.meta?.target?.[0];
    message = field ? `${field} already exists` : "Duplicate value";
  } else if (err.code === "P2025") {
    // Prisma: record required for this operation was not found
    statusCode = 404;
    message = "Record not found";
  } else if (err.code === "P2003") {
    // Prisma foreign key constraint failed — referenced a record that doesn't exist
    statusCode = 400;
    message = "Referenced record does not exist";
  } else if (err.name === "PrismaClientValidationError") {
    statusCode = 400;
    message = "Invalid request data";
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
