import { Router } from "express";
import * as ctrl from "../controllers/patient.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import {
  createPatientSchema,
  updatePatientSchema,
  addMedicalHistorySchema,
  listPatientsQuerySchema,
} from "../validators/patient.validators.js";

const router = Router();

router.use(requireAuth);

router.get("/me", requireRole("patient"), ctrl.getMyPatientProfile);

router.get(
  "/",
  requireRole("admin", "doctor", "receptionist"),
  validate(listPatientsQuerySchema, "query"),
  ctrl.listPatients
);
router.post(
  "/",
  requireRole("admin", "receptionist"),
  validate(createPatientSchema),
  ctrl.createPatient
);
router.get("/:id", requireRole("admin", "doctor", "receptionist"), ctrl.getPatient);
router.patch(
  "/:id",
  requireRole("admin", "receptionist"),
  validate(updatePatientSchema),
  ctrl.updatePatient
);
router.delete("/:id", requireRole("admin"), ctrl.deletePatient);
router.post(
  "/:id/medical-history",
  requireRole("admin", "doctor"),
  validate(addMedicalHistorySchema),
  ctrl.addMedicalHistory
);

export default router;
