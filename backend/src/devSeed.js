import { User } from "./models/User.js";
import { Department } from "./models/Department.js";
import { Doctor } from "./models/Doctor.js";
import { Medicine } from "./models/Medicine.js";
import { Ward } from "./models/Ward.js";
import { Bed } from "./models/Bed.js";
import { createUser } from "./services/auth.service.js";

const DEMO_PASSWORD = "Password123";

// Only ever called against the throwaway in-memory dev database (see config/db.js) —
// gives every role a ready-to-use login without needing a real Atlas cluster.
export const seedDevAccounts = async () => {
  const existingAdmin = await User.findOne({ email: "admin@demo.hms" });
  if (existingAdmin) return null;

  const admin = await createUser({ name: "Ava Administrator", email: "admin@demo.hms", password: DEMO_PASSWORD, role: "admin" });

  const department = await Department.create({ name: "General Medicine", description: "Primary care and general consultations" });

  const doctorUser = await createUser({ name: "Riley Chen", email: "doctor@demo.hms", password: DEMO_PASSWORD, role: "doctor" });
  await Doctor.create({
    user: doctorUser._id,
    department: department._id,
    specialization: "General Medicine",
    consultationFee: 75,
    schedule: [
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30 },
      { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30 },
      { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30 },
      { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", slotDurationMinutes: 30 },
      { dayOfWeek: 5, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30 },
    ],
  });

  await createUser({ name: "Priya Desk", email: "receptionist@demo.hms", password: DEMO_PASSWORD, role: "receptionist" });

  await Medicine.insertMany([
    { name: "Paracetamol 500mg", genericName: "Acetaminophen", category: "Analgesic", manufacturer: "Generix", unit: "tablet", stockQuantity: 240, reorderLevel: 50, unitPrice: 0.15 },
    { name: "Amoxicillin 250mg", genericName: "Amoxicillin", category: "Antibiotic", manufacturer: "MedCore", unit: "capsule", stockQuantity: 120, reorderLevel: 40, unitPrice: 0.45 },
    { name: "Cetirizine 10mg", genericName: "Cetirizine", category: "Antihistamine", manufacturer: "Generix", unit: "tablet", stockQuantity: 300, reorderLevel: 60, unitPrice: 0.1 },
    { name: "Ibuprofen 400mg", genericName: "Ibuprofen", category: "Analgesic", manufacturer: "MedCore", unit: "tablet", stockQuantity: 15, reorderLevel: 50, unitPrice: 0.2 }, // seeded low to show the alert
    { name: "Omeprazole 20mg", genericName: "Omeprazole", category: "Antacid", manufacturer: "PharmaPlus", unit: "capsule", stockQuantity: 90, reorderLevel: 30, unitPrice: 0.35 },
  ]);

  const generalWard = await Ward.create({ name: "General Ward A", type: "general", floor: 1, totalBeds: 3 });
  const icuWard = await Ward.create({ name: "ICU", type: "icu", floor: 2, totalBeds: 2 });
  await Bed.insertMany([
    { ward: generalWard._id, bedNumber: "A-101" },
    { ward: generalWard._id, bedNumber: "A-102" },
    { ward: generalWard._id, bedNumber: "A-103" },
    { ward: icuWard._id, bedNumber: "ICU-1" },
    { ward: icuWard._id, bedNumber: "ICU-2" },
  ]);

  const credentials = [
    { role: "admin", email: admin.email, password: DEMO_PASSWORD },
    { role: "doctor", email: doctorUser.email, password: DEMO_PASSWORD },
    { role: "receptionist", email: "receptionist@demo.hms", password: DEMO_PASSWORD },
  ];

  console.log("\n🌱  Seeded demo accounts (in-memory DB only):");
  credentials.forEach((c) => console.log(`   ${c.role.padEnd(13)} ${c.email}  /  ${c.password}`));
  console.log("   patient        — register your own at /register\n");

  return credentials;
};
