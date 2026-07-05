// MongoDB connection — serverless-safe with cached promise and fail-fast timeouts.

import mongoose from "mongoose";
import { env } from "./env";

let connectPromise: Promise<typeof mongoose> | null = null;

function validateMongoUri(uri: string): void {
  if (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://")) {
    return;
  }
  throw new Error(
    'Invalid MONGODB_URI: must start with "mongodb://" or "mongodb+srv://"'
  );
}

export async function connectDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  if (!connectPromise) {
    validateMongoUri(env.mongodbUri);
    connectPromise = mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
      bufferCommands: false,
    });
  }

  try {
    await connectPromise;
    console.log("MongoDB connected");
  } catch (err) {
    connectPromise = null;
    throw err;
  }
}
