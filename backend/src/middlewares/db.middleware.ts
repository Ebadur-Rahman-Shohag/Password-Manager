// Ensures MongoDB is connected before data routes run.

import { Request, Response, NextFunction } from "express";
import { connectDb } from "../config/db";

export async function ensureDb(
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await connectDb();
    next();
  } catch (err) {
    next(err);
  }
}
