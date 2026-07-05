import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, PasswordInput } from "../../../components/ui";
import { useAuth } from "../context/AuthContext";
import { useCrypto } from "../../../crypto/CryptoContext";

export function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { unlock, isUnlocked } = useCrypto();
  const [email, setEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmMasterPassword, setConfirmMasterPassword] = useState("");
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

    if (masterPassword.length < 8) {
      setError("Master password must be at least 8 characters");
      return;
    }
    if (masterPassword !== confirmMasterPassword) {
      setError("Master passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const session = await register(email, accountPassword);
      await unlock(masterPassword, {
        encryptionSalt: session.encryptionSalt,
        verificationBlob: session.verificationBlob,
      });
      setMasterPassword("");
      setConfirmMasterPassword("");
      setPendingVaultNav(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <PasswordInput
        label="Account password"
        placeholder="For logging in to the server"
        value={accountPassword}
        onChange={(e) => setAccountPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
      />
      <PasswordInput
        label="Master password"
        placeholder="Encrypts your vault — never sent to server"
        value={masterPassword}
        onChange={(e) => setMasterPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
      />
      <PasswordInput
        label="Confirm master password"
        placeholder="••••••••"
        value={confirmMasterPassword}
        onChange={(e) => setConfirmMasterPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Register"}
      </Button>
    </form>
  );
}
