// User Mongoose model — stores account credentials only (not master password).

import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  encryptionSalt: string;
  tokenVersion: number;
  verificationCiphertext?: string | null;
  verificationIv?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    encryptionSalt: { type: String, required: true },
    tokenVersion: { type: Number, default: 0 },
    verificationCiphertext: { type: String, default: null },
    verificationIv: { type: String, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
