// Vault HTTP handlers — request/response layer only.

import { Response, NextFunction } from "express";
import type { CreateVaultRequest, UpdateVaultRequest } from "@password-manager/shared";
import { AuthRequest } from "../../middlewares/auth.middleware";
import * as vaultService from "./vault.service";

export async function list(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const entries = await vaultService.listVaultEntries(req.userId!);
    res.status(200).json(entries);
  } catch (err) {
    next(err);
  }
}

export async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const entry = await vaultService.createVaultEntry(
      req.userId!,
      req.body as CreateVaultRequest
    );
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

export async function update(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const entry = await vaultService.updateVaultEntry(
      req.userId!,
      id,
      req.body as UpdateVaultRequest
    );
    res.status(200).json(entry);
  } catch (err) {
    next(err);
  }
}

export async function remove(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    await vaultService.deleteVaultEntry(req.userId!, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
