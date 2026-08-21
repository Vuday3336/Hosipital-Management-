import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5001,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  // Left undefined when unset — connectDB() decides what to do about it
  // (falls back to a local in-memory Mongo outside production).
  mongoUri: process.env.MONGO_URI,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || "Hospital Management System <no-reply@hms.local>",
  },

  upload: {
    dir: process.env.UPLOAD_DIR || "uploads",
    maxMb: Number(process.env.MAX_UPLOAD_MB) || 5,
  },

  authRateLimit: {
    windowMin: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MIN) || 15,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  },
};
