import nodemailer from "nodemailer";
import { env } from "./env.js";

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
};

export const sendMail = async ({ to, subject, html, text }) => {
  if (!env.smtp.host || env.nodeEnv === "test") {
    // No SMTP configured (or running tests) — skip silently instead of failing the request.
    return { skipped: true };
  }
  return getTransporter().sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
    text,
  });
};
