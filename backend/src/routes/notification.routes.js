import { Router } from "express";
import * as ctrl from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", ctrl.listMyNotifications);
router.patch("/:id/read", ctrl.markAsRead);
router.patch("/read-all", ctrl.markAllAsRead);

export default router;
