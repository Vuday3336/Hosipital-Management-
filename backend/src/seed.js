import { connectDB, disconnectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { createUser } from "./services/auth.service.js";

const seedAdmin = async () => {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL || "admin@hms.local";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
  } else {
    await createUser({ name: "System Admin", email, password, role: "admin" });
    console.log(`Seeded admin account: ${email} / ${password} — change this password after first login.`);
  }

  await disconnectDB();
};

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
