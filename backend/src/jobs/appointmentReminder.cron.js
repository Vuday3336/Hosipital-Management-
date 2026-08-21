import cron from "node-cron";
import { Appointment } from "../models/Appointment.js";
import { notifyUser } from "../services/notification.service.js";
import { sendAppointmentReminderEmail } from "../services/email.service.js";

// Runs every hour; reminds patients about appointments happening tomorrow.
export const scheduleAppointmentReminders = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().slice(0, 10);

      const appointments = await Appointment.find({ date: dateStr, status: "confirmed" })
        .populate({ path: "doctor", populate: "user" })
        .populate({ path: "patient", populate: "user" });

      await Promise.all(
        appointments.map(async (appt) => {
          const recipientEmail = appt.patient?.email || appt.patient?.user?.email;
          if (recipientEmail) {
            await sendAppointmentReminderEmail(recipientEmail, {
              doctorName: appt.doctor.user.name,
              date: appt.date,
              startTime: appt.startTime,
            });
          }
          if (appt.patient?.user) {
            await notifyUser({
              userId: appt.patient.user,
              type: "appointment_reminder",
              title: "Appointment tomorrow",
              message: `Reminder: your appointment with Dr. ${appt.doctor.user.name} is tomorrow at ${appt.startTime}.`,
              relatedEntity: { kind: "Appointment", id: appt._id },
            });
          }
        })
      );
    } catch (err) {
      console.error("[appointmentReminder] failed:", err.message);
    }
  });
};
