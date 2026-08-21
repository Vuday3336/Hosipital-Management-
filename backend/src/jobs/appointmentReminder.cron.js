import cron from "node-cron";
import { prisma } from "../config/db.js";
import { notifyUser } from "../services/notification.service.js";
import { sendAppointmentReminderEmail } from "../services/email.service.js";
import { publicUserSelect } from "../utils/serialize.js";

// Runs every hour; reminds patients about appointments happening tomorrow.
export const scheduleAppointmentReminders = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().slice(0, 10);

      const appointments = await prisma.appointment.findMany({
        where: { date: dateStr, status: "confirmed" },
        include: {
          doctor: { include: { user: { select: publicUserSelect } } },
          patient: true,
        },
      });

      await Promise.all(
        appointments.map(async (appt) => {
          const recipientEmail = appt.patient?.email;
          if (recipientEmail) {
            await sendAppointmentReminderEmail(recipientEmail, {
              doctorName: appt.doctor.user.name,
              date: appt.date,
              startTime: appt.startTime,
            });
          }
          if (appt.patient?.userId) {
            await notifyUser({
              userId: appt.patient.userId,
              type: "appointment_reminder",
              title: "Appointment tomorrow",
              message: `Reminder: your appointment with Dr. ${appt.doctor.user.name} is tomorrow at ${appt.startTime}.`,
              relatedEntity: { kind: "Appointment", id: appt.id },
            });
          }
        })
      );
    } catch (err) {
      console.error("[appointmentReminder] failed:", err.message);
    }
  });
};
