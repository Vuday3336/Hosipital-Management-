import { Router } from "express";
import * as ctrl from "../controllers/ward.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createWardSchema, createBedSchema } from "../validators/ward.validators.js";

const router = Router();

router.use(requireAuth, requireRole("admin", "doctor", "receptionist"));

router.get("/", ctrl.listWards);
router.post("/", requireRole("admin"), validate(createWardSchema), ctrl.createWard);
router.delete("/:id", requireRole("admin"), ctrl.deleteWard);

router.get("/beds/all", ctrl.listBeds);
router.post("/beds", requireRole("admin"), validate(createBedSchema), ctrl.createBed);

export default router;
