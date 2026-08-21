import { prisma } from "../src/config/db.js";

beforeAll(async () => {
  await prisma.$connect();
});

// Deleted in FK-safe order: dependents before the tables they reference.
afterEach(async () => {
  await prisma.dispensingLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.admission.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.department.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
