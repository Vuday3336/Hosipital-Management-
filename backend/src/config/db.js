import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env.js";

const adapter = new PrismaPg({ connectionString: env.databaseUrl });
export const prisma = new PrismaClient({ adapter });

export const connectDB = async () => {
  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL is required — set it to your Supabase Session Pooler connection string (see .env.example)."
    );
  }
  await prisma.$connect();
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
};
