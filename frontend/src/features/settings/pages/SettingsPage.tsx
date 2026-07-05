import { Link } from "react-router-dom";
import { ChangeMasterPasswordForm } from "../components/ChangeMasterPasswordForm";

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-md p-8">
      <div className="mb-6">
        <Link to="/vault" className="text-sm text-blue-600 hover:underline">
          Back to vault
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-600">Manage your vault security preferences.</p>
      </div>
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Change master password</h2>
        <ChangeMasterPasswordForm />
      </div>
    </div>
  );
}
