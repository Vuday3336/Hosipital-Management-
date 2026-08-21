import { Router } from "express";
import * as ctrl from "../controllers/medicine.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import {
  createMedicineSchema,
  updateMedicineSchema,
  adjustStockSchema,
  dispenseSchema,
  listMedicinesQuerySchema,
} from "../validators/medicine.validators.js";

const router = Router();

router.use(requireAuth);

// A patient may see their own dispensing history, but never the inventory itself.
router.get("/my-dispensing-log", requireRole("patient"), ctrl.listMyDispensingLogs);

router.use(requireRole("admin", "doctor", "receptionist"));

router.get("/", validate(listMedicinesQuerySchema, "query"), ctrl.listMedicines);
router.post("/", requireRole("admin"), validate(createMedicineSchema), ctrl.createMedicine);
router.get("/dispensing-logs", ctrl.listDispensingLogs);
router.post("/dispense", requireRole("admin", "receptionist"), validate(dispenseSchema), ctrl.dispense);
router.get("/:id", ctrl.getMedicine);
router.patch("/:id", requireRole("admin"), validate(updateMedicineSchema), ctrl.updateMedicine);
router.patch(
  "/:id/stock",
  requireRole("admin", "receptionist"),
  validate(adjustStockSchema),
  ctrl.adjustStock
);
router.delete("/:id", requireRole("admin"), ctrl.deleteMedicine);

export default router;
