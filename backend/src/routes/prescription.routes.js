import { Router } from "express";
import * as ctrl from "../controllers/prescription.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createPrescriptionSchema } from "../validators/prescription.validators.js";

const router = Router();

router.use(requireAuth);

router.get("/", ctrl.listPrescriptions);
router.post("/", requireRole("doctor"), validate(createPrescriptionSchema), ctrl.createPrescription);
router.get("/:id", ctrl.getPrescription);

export default router;
