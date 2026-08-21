import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/config/db.js";
import { createUser, issueTokenPair } from "../../src/services/auth.service.js";

const app = createApp();

const asAdmin = async () => {
  const admin = await createUser({ name: "Admin", email: "admin@hms.local", password: "Password123", role: "admin" });
  const { accessToken } = await issueTokenPair(admin, "test");
  return { admin, accessToken };
};

const setupDoctorAndPatient = async () => {
  const department = await prisma.department.create({ data: { name: "Cardiology" } });
  const doctorUser = await createUser({ name: "Dr. Strange", email: "strange@hms.local", password: "Password123", role: "doctor" });
  const doctor = await prisma.doctor.create({
    data: {
      userId: doctorUser.id,
      departmentId: department.id,
      specialization: "Cardiology",
      schedule: [{ dayOfWeek: 1, startTime: "09:00", endTime: "12:00", slotDurationMinutes: 30 }], // Monday
    },
  });
  const patient = await prisma.patient.create({
    data: { firstName: "John", lastName: "Smith", dob: new Date("1990-01-01"), gender: "male" },
  });
  return { department, doctor, patient };
};

// 2024-01-01 is a Monday — keeps the fixture inside the doctor's Monday schedule block.
const MONDAY = "2024-01-01";

describe("Appointment conflict prevention", () => {
  test("books a valid slot inside the doctor's schedule", async () => {
    const { accessToken } = await asAdmin();
    const { doctor, patient } = await setupDoctorAndPatient();

    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ patient: patient.id, doctor: doctor.id, date: MONDAY, startTime: "09:00", endTime: "09:30" });

    expect(res.status).toBe(201);
    expect(res.body.data.appointment.status).toBe("pending");
  });

  test("rejects an exact duplicate time slot for the same doctor", async () => {
    const { accessToken } = await asAdmin();
    const { doctor, patient } = await setupDoctorAndPatient();

    const body = { patient: patient.id, doctor: doctor.id, date: MONDAY, startTime: "09:00", endTime: "09:30" };
    await request(app).post("/api/appointments").set("Authorization", `Bearer ${accessToken}`).send(body);
    const res = await request(app).post("/api/appointments").set("Authorization", `Bearer ${accessToken}`).send(body);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test("rejects an overlapping (but not identical) time slot", async () => {
    const { accessToken } = await asAdmin();
    const { doctor, patient } = await setupDoctorAndPatient();

    await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ patient: patient.id, doctor: doctor.id, date: MONDAY, startTime: "09:00", endTime: "09:30" });

    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ patient: patient.id, doctor: doctor.id, date: MONDAY, startTime: "09:15", endTime: "09:45" });

    expect(res.status).toBe(409);
  });

  test("allows back-to-back non-overlapping slots", async () => {
    const { accessToken } = await asAdmin();
    const { doctor, patient } = await setupDoctorAndPatient();

    await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ patient: patient.id, doctor: doctor.id, date: MONDAY, startTime: "09:00", endTime: "09:30" });

    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ patient: patient.id, doctor: doctor.id, date: MONDAY, startTime: "09:30", endTime: "10:00" });

    expect(res.status).toBe(201);
  });

  test("a cancelled appointment frees up its slot", async () => {
    const { accessToken } = await asAdmin();
    const { doctor, patient } = await setupDoctorAndPatient();

    const first = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ patient: patient.id, doctor: doctor.id, date: MONDAY, startTime: "09:00", endTime: "09:30" });

    await request(app)
      .post(`/api/appointments/${first.body.data.appointment._id}/cancel`)
      .set("Authorization", `Bearer ${accessToken}`);

    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ patient: patient.id, doctor: doctor.id, date: MONDAY, startTime: "09:00", endTime: "09:30" });

    expect(res.status).toBe(201);
  });

  test("rejects a booking outside the doctor's working hours", async () => {
    const { accessToken } = await asAdmin();
    const { doctor, patient } = await setupDoctorAndPatient();

    const res = await request(app)
      .post("/api/appointments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ patient: patient.id, doctor: doctor.id, date: MONDAY, startTime: "18:00", endTime: "18:30" });

    expect(res.status).toBe(400);
  });
});
