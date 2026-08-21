import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { scheduleLowStockCheck } from "./jobs/lowStockCheck.cron.js";
import { scheduleAppointmentReminders } from "./jobs/appointmentReminder.cron.js";

const start = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected");

    const app = createApp();
    app.listen(env.port, () => {
      console.log(`API listening on port ${env.port} [${env.nodeEnv}]`);
    });

    scheduleLowStockCheck();
    scheduleAppointmentReminders();
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();
