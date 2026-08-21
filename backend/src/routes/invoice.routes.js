import { Router } from "express";
import * as ctrl from "../controllers/invoice.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import {
  createInvoiceSchema,
  recordPaymentSchema,
  listInvoicesQuerySchema,
} from "../validators/invoice.validators.js";

const router = Router();

router.use(requireAuth);

router.get("/", validate(listInvoicesQuerySchema, "query"), ctrl.listInvoices);
router.post(
  "/",
  requireRole("admin", "receptionist"),
  validate(createInvoiceSchema),
  ctrl.createInvoice
);
router.get("/:id", ctrl.getInvoice);
router.post(
  "/:id/payments",
  requireRole("admin", "receptionist"),
  validate(recordPaymentSchema),
  ctrl.recordPayment
);
router.get("/:id/pdf", ctrl.downloadInvoicePdf);

export default router;
