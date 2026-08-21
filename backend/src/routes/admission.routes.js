import { Router } from "express";
import * as ctrl from "../controllers/admission.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import {
  createAdmissionSchema,
  dischargeAdmissionSchema,
  listAdmissionsQuerySchema,
} from "../validators/admission.validators.js";

const router = Router();

router.use(requireAuth, requireRole("admin", "doctor", "receptionist"));

router.get("/", validate(listAdmissionsQuerySchema, "query"), ctrl.listAdmissions);
router.post(
  "/",
  requireRole("admin", "receptionist"),
  validate(createAdmissionSchema),
  ctrl.createAdmission
);
router.get("/:id", ctrl.getAdmission);
router.post(
  "/:id/discharge",
  requireRole("admin", "doctor"),
  validate(dischargeAdmissionSchema),
  ctrl.dischargePatient
);

export default router;
