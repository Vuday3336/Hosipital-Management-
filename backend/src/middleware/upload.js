import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

if (!fs.existsSync(env.upload.dir)) {
  fs.mkdirSync(env.upload.dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.upload.dir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const allowedMimes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export const upload = multer({
  storage,
  limits: { fileSize: env.upload.maxMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});
