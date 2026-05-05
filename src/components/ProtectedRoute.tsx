import { Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '@/hooks/useAuth';

interface Props {
  children: React.ReactNode;
  /**
   * Optional role gate. If omitted, any authenticated user passes.
   * Pass a role name (e.g. 'Admin') or an array of role names — the user
   * needs to hold at least one of them.
   */
  requiredRole?: UserRole | UserRole[];
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { isAuthenticated, hasAnyRole } = useAuth();

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  if (requiredRole) {
    const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!hasAnyRole(...required)) return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
