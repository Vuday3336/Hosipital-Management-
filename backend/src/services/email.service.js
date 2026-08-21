import { sendMail } from "../config/mailer.js";
import { env } from "../config/env.js";

const wrap = (title, bodyHtml) => `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:8px;">
    <h2 style="color:#0f7a6b;margin-top:0;">${title}</h2>
    ${bodyHtml}
    <p style="color:#94a3b8;font-size:12px;margin-top:32px;">Hospital Management System — automated notification</p>
  </div>
`;

export const sendPasswordResetEmail = (to, token) => {
  const link = `${env.clientUrl}/reset-password?token=${token}`;
  return sendMail({
    to,
    subject: "Reset your password",
    html: wrap(
      "Password reset request",
      `<p>Click the link below to set a new password. This link expires in 1 hour.</p>
       <p><a href="${link}" style="color:#0f7a6b;">${link}</a></p>
       <p>If you didn't request this, you can safely ignore this email.</p>`
    ),
  });
};

export const sendWelcomeEmail = (to, name) =>
  sendMail({
    to,
    subject: "Welcome to Hospital Management System",
    html: wrap("Welcome, " + name, `<p>Your account has been created successfully.</p>`),
  });

export const sendAppointmentConfirmationEmail = (to, { doctorName, date, startTime }) =>
  sendMail({
    to,
    subject: "Appointment confirmed",
    html: wrap(
      "Appointment confirmed",
      `<p>Your appointment with <b>Dr. ${doctorName}</b> is scheduled for <b>${date} at ${startTime}</b>.</p>`
    ),
  });

export const sendAppointmentReminderEmail = (to, { doctorName, date, startTime }) =>
  sendMail({
    to,
    subject: "Appointment reminder",
    html: wrap(
      "Reminder: upcoming appointment",
      `<p>This is a reminder for your appointment with <b>Dr. ${doctorName}</b> on <b>${date} at ${startTime}</b>.</p>`
    ),
  });

export const sendLowStockEmail = (to, items) =>
  sendMail({
    to,
    subject: `Low stock alert — ${items.length} item(s)`,
    html: wrap(
      "Low stock alert",
      `<ul>${items.map((i) => `<li>${i.name}: ${i.stockQuantity} left (reorder at ${i.reorderLevel})</li>`).join("")}</ul>`
    ),
  });
