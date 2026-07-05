// Vault Mongoose model — stores encrypted blobs only.

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IVaultEntry extends Document {
  userId: Types.ObjectId;
  ciphertext: string;
  iv: string;
  createdAt: Date;
  updatedAt: Date;
}

const vaultSchema = new Schema<IVaultEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
  },
  { timestamps: true }
);

export const VaultEntry = mongoose.model<IVaultEntry>("VaultEntry", vaultSchema);
