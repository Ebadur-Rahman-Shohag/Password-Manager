import { Routes, Route } from "react-router-dom";
import { LoginPage, RegisterPage } from "./features/auth";
import { UnlockPage } from "./features/auth/pages/UnlockPage";
import { VaultPage } from "./features/vault";
import { SettingsPage } from "./features/settings/pages/SettingsPage";
import { ProtectedRoute, HomeRedirect } from "./components/ProtectedRoute";

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route element={<ProtectedRoute redirectIfAuthenticated="/vault" />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute redirectIfUnlocked="/vault" />}>
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute requireAuth redirectIfUnlocked="/vault" />}>
          <Route path="/unlock" element={<UnlockPage />} />
        </Route>

        <Route element={<ProtectedRoute requireAuth requireUnlock />}>
          <Route path="/vault" element={<VaultPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </div>
  );
}
