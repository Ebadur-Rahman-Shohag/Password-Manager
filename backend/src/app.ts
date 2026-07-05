// Express application setup — mounts feature routers and global middleware.

import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { env } from "./config/env";
import { authRouter } from "./modules/auth";
import { vaultRouter } from "./modules/vault";
import { errorMiddleware } from "./middlewares/error.middleware";
import { securityMiddleware } from "./middlewares/security.middleware";

export const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(securityMiddleware);
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/vault", vaultRouter);

app.use(errorMiddleware);
