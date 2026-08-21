import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import path from "path";

import { env } from "./config/env.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { sendSuccess } from "./utils/ApiResponse.js";

import authRoutes from "./routes/auth.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import prescriptionRoutes from "./routes/prescription.routes.js";
import wardRoutes from "./routes/ward.routes.js";
import admissionRoutes from "./routes/admission.routes.js";
import medicineRoutes from "./routes/medicine.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  if (env.nodeEnv !== "test") {
    app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));
  }
  app.use(`/${env.upload.dir}`, express.static(path.resolve(env.upload.dir)));

  app.get("/api/health", (req, res) => sendSuccess(res, { message: "Service healthy", data: { uptime: process.uptime() } }));

  app.use("/api/auth", authRoutes);
  app.use("/api/patients", patientRoutes);
  app.use("/api/doctors", doctorRoutes);
  app.use("/api/departments", departmentRoutes);
  app.use("/api/staff", staffRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/prescriptions", prescriptionRoutes);
  app.use("/api/wards", wardRoutes);
  app.use("/api/admissions", admissionRoutes);
  app.use("/api/medicines", medicineRoutes);
  app.use("/api/invoices", invoiceRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/notifications", notificationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
