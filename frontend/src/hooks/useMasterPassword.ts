// Master password hook — keeps master password in memory only, never persisted.

import { useState } from "react";

export function useMasterPassword() {
  const [masterPassword, setMasterPassword] = useState<string | null>(null);

  return {
    masterPassword,
    setMasterPassword,
    clearMasterPassword: () => setMasterPassword(null),
    hasMasterPassword: masterPassword !== null,
  };
}
