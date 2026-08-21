import cron from "node-cron";
import { findLowStockMedicines, alertLowStock } from "../services/pharmacy.service.js";

// Runs once a day at 07:00 server time.
export const scheduleLowStockCheck = () => {
  cron.schedule("0 7 * * *", async () => {
    try {
      const lowStock = await findLowStockMedicines();
      if (lowStock.length) await alertLowStock(lowStock);
    } catch (err) {
      console.error("[lowStockCheck] failed:", err.message);
    }
  });
};
