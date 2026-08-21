import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";

export const signAccessToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });

export const signRefreshToken = (user) =>
  jwt.sign({ sub: user.id, jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwt.accessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwt.refreshSecret);

export const refreshExpiryDate = () => {
  // Mirrors JWT_REFRESH_EXPIRES_IN so DB-stored tokens expire alongside the signed token.
  const ms = parseDurationToMs(env.jwt.refreshExpiresIn);
  return new Date(Date.now() + ms);
};

function parseDurationToMs(duration) {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return value * unit;
}

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
