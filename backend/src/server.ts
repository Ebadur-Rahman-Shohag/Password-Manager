// Server entry point — connects DB stub and starts listening.

import { app } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";

async function start(): Promise<void> {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
