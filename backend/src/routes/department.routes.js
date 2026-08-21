import { Router } from "express";
import * as ctrl from "../controllers/department.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createDepartmentSchema, updateDepartmentSchema } from "../validators/department.validators.js";

const router = Router();

router.use(requireAuth);

router.get("/", ctrl.listDepartments);
router.get("/:id", ctrl.getDepartment);
router.post("/", requireRole("admin"), validate(createDepartmentSchema), ctrl.createDepartment);
router.patch("/:id", requireRole("admin"), validate(updateDepartmentSchema), ctrl.updateDepartment);
router.delete("/:id", requireRole("admin"), ctrl.deleteDepartment);

export default router;
