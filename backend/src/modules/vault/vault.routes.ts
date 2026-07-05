// Vault routes — GET/POST /vault, PUT/DELETE /vault/:id.

import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validateMiddleware } from "../../middlewares/validate.middleware";
import { apiRateLimiter } from "../../middlewares/rateLimit.middleware";
import { slidingSessionMiddleware } from "../../middlewares/slidingSession.middleware";
import * as vaultController from "./vault.controller";
import { createVaultSchema, updateVaultSchema } from "./vault.schema";

export const vaultRouter = Router();

vaultRouter.use(apiRateLimiter);
vaultRouter.use(authMiddleware);
vaultRouter.use(slidingSessionMiddleware);

vaultRouter.get("/", vaultController.list);
vaultRouter.post("/", validateMiddleware(createVaultSchema), vaultController.create);
vaultRouter.put("/:id", validateMiddleware(updateVaultSchema), vaultController.update);
vaultRouter.delete("/:id", vaultController.remove);
