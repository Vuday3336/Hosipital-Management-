import { Router } from "express";
import { z } from "zod";
import * as ctrl from "../controllers/staff.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createStaffSchema } from "../validators/auth.validators.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", ctrl.listStaff);
router.post("/", validate(createStaffSchema), ctrl.createStaff);
router.patch("/:id/status", validate(z.object({ isActive: z.boolean() })), ctrl.setStaffActive);

export default router;
