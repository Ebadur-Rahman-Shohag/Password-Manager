import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, PasswordInput } from "../../../components/ui";
import { useAuth } from "../../auth/context/AuthContext";
import { useCrypto } from "../../../crypto/CryptoContext";
import { changeMasterPassword } from "../../../crypto/changeMasterPassword";
import { deriveKey } from "../../../crypto";

export function ChangeMasterPasswordForm() {
  const navigate = useNavigate();
  const { encryptionSalt, verificationBlob, setVerificationBlob } = useAuth();
  const { replaceKey } = useCrypto();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New master password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New master passwords do not match");
      return;
    }
    if (!encryptionSalt || !verificationBlob) {
      setError("Vault is not ready for master password change");
      return;
    }

    setIsLoading(true);
    try {
      const { verificationBlob: updatedBlob } = await changeMasterPassword({
        encryptionSalt,
        currentMasterPassword: currentPassword,
        newMasterPassword: newPassword,
        verificationBlob,
      });

      const newKey = await deriveKey(newPassword, encryptionSalt);
      replaceKey(newKey);
      setVerificationBlob(updatedBlob);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      navigate("/vault");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change master password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <PasswordInput
        label="Current master password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      <PasswordInput
        label="New master password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
      />
      <PasswordInput
        label="Confirm new master password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Change master password"}
        </Button>
        <Button type="button" onClick={() => navigate("/vault")}>
          Cancel
        </Button>
      </div>
      <p className="text-sm text-gray-500">
        All vault entries will be re-encrypted with your new master password. This may take a
        moment.
      </p>
    </form>
  );
}
