import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);

export const connectDB = async () => {
  if (env.mongoUri) {
    return mongoose.connect(env.mongoUri);
  }

  if (env.nodeEnv === "production") {
    throw new Error("MONGO_URI is required in production — set it to your MongoDB Atlas connection string.");
  }

  // No MONGO_URI configured (e.g. no Atlas cluster set up yet) — spin up a throwaway
  // local Mongo so `npm run dev` works out of the box. Data does not persist across restarts.
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const mongod = await MongoMemoryServer.create();
  console.warn(
    `\n⚠  No MONGO_URI set — using a temporary in-memory database for this session.\n` +
      `   Data will NOT persist across restarts. Set MONGO_URI in backend/.env\n` +
      `   (e.g. a free MongoDB Atlas cluster) for real local development.\n`
  );
  return mongoose.connect(mongod.getUri());
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
};
