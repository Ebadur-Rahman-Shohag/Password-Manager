import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/context/AuthContext";
import { useCrypto } from "../crypto/CryptoContext";

interface ProtectedRouteProps {
  requireAuth?: boolean;
  requireUnlock?: boolean;
  redirectIfAuthenticated?: string;
  redirectIfUnlocked?: string;
}

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center text-gray-500">
      Loading...
    </div>
  );
}

export function ProtectedRoute({
  requireAuth = false,
  requireUnlock = false,
  redirectIfAuthenticated,
  redirectIfUnlocked,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { isUnlocked } = useCrypto();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (redirectIfAuthenticated && isAuthenticated) {
    if (isUnlocked) {
      return <Navigate to={redirectIfAuthenticated} replace />;
    }
    return <Navigate to="/unlock" replace />;
  }

  if (redirectIfUnlocked && isUnlocked) {
    return <Navigate to={redirectIfUnlocked} replace />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireUnlock && !isUnlocked) {
    return <Navigate to="/unlock" replace />;
  }

  return <Outlet />;
}

export function HomeRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isUnlocked } = useCrypto();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isUnlocked) {
    return <Navigate to="/unlock" replace />;
  }
  return <Navigate to="/vault" replace />;
}
