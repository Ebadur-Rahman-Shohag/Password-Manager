// Request validation middleware stub using Zod.

import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validateMiddleware(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Validation failed", errors: result.error.flatten() });
      return;
    }
    req.body = result.data;
    next();
  };
}
