// API call to store the encrypted verification blob on the user record.

import type { VerificationBlob } from "@password-manager/shared";
import { apiClient } from "../../../api/client";

export async function setupVerificationBlob(
  blob: VerificationBlob
): Promise<VerificationBlob> {
  const response = await apiClient<{ verificationBlob: VerificationBlob }>(
    "/auth/verification",
    {
      method: "PUT",
      body: JSON.stringify({ verificationBlob: blob }),
    }
  );
  return response.verificationBlob;
}
