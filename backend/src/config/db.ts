// MongoDB connection — fails fast if database is unreachable.

import mongoose from "mongoose";
import { env } from "./env";

export async function connectDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(env.mongodbUri);
  console.log("MongoDB connected");
}
