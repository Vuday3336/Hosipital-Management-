import { Router } from "express";
import * as ctrl from "../controllers/appointment.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
  listAppointmentsQuerySchema,
  availabilityQuerySchema,
} from "../validators/appointment.validators.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/availability/:doctorId",
  validate(availabilityQuerySchema, "query"),
  ctrl.getDoctorAvailability
);
router.get("/", validate(listAppointmentsQuerySchema, "query"), ctrl.listAppointments);
router.post(
  "/",
  requireRole("admin", "receptionist", "patient"),
  validate(createAppointmentSchema),
  ctrl.createAppointment
);
router.get("/:id", ctrl.getAppointment);
router.patch(
  "/:id/status",
  requireRole("admin", "receptionist", "doctor"),
  validate(updateAppointmentStatusSchema),
  ctrl.updateAppointmentStatus
);
router.patch(
  "/:id/reschedule",
  requireRole("admin", "receptionist", "patient"),
  validate(rescheduleAppointmentSchema),
  ctrl.rescheduleAppointment
);
router.post("/:id/cancel", ctrl.cancelAppointment);

export default router;
