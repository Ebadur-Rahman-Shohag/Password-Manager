import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, PasswordInput } from "../../../components/ui";
import { useCrypto } from "../../../crypto/CryptoContext";

export function UnlockPage() {
  const navigate = useNavigate();
  const { unlock, isUnlocked } = useCrypto();
  const [masterPassword, setMasterPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVaultNav, setPendingVaultNav] = useState(false);

  useEffect(() => {
    if (pendingVaultNav && isUnlocked) {
      navigate("/vault", { replace: true });
      setPendingVaultNav(false);
    }
  }, [pendingVaultNav, isUnlocked, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await unlock(masterPassword);
      setMasterPassword("");
      setPendingVaultNav(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock vault");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-2 text-2xl font-bold">Unlock vault</h1>
        <p className="mb-6 text-sm text-gray-600">
          Enter your master password to decrypt your vault. This is separate from your login
          password and is never sent to the server.
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <PasswordInput
            label="Master password"
            placeholder="••••••••"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Unlocking..." : "Unlock"}
          </Button>
        </form>
      </div>
    </div>
  );
}
