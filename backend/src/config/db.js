import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);

export const connectDB = async () => {
  const conn = await mongoose.connect(env.mongoUri);
  return conn;
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
};
