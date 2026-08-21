import { Router } from "express";
import * as ctrl from "../controllers/analytics.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

router.use(requireAuth);

router.get("/admin-overview", requireRole("admin"), ctrl.adminOverview);
router.get("/doctor-overview", requireRole("doctor"), ctrl.doctorOverview);

export default router;
