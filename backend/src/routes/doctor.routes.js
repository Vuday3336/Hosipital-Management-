import { Router } from "express";
import * as ctrl from "../controllers/doctor.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import {
  createDoctorSchema,
  updateDoctorSchema,
  setScheduleSchema,
  listDoctorsQuerySchema,
} from "../validators/doctor.validators.js";

const router = Router();

router.use(requireAuth);

router.get("/me", requireRole("doctor"), ctrl.getMyDoctorProfile);
router.get("/", validate(listDoctorsQuerySchema, "query"), ctrl.listDoctors);
router.get("/:id", ctrl.getDoctor);
router.post("/", requireRole("admin"), validate(createDoctorSchema), ctrl.createDoctor);
router.patch("/:id", requireRole("admin"), validate(updateDoctorSchema), ctrl.updateDoctor);
router.put(
  "/:id/schedule",
  requireRole("admin", "doctor"),
  validate(setScheduleSchema),
  ctrl.setSchedule
);
router.post("/:id/deactivate", requireRole("admin"), ctrl.deactivateDoctor);

export default router;
