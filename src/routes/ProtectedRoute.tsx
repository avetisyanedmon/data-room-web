import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMeQuery } from '@/api/auth-api-ts/authApi';
import { Spinner } from '@/components/ui/Spinner';
import { clearAuthToken, getAuthToken, isTokenExpired } from '@/lib/auth-storage';

export function ProtectedRoute() {
  const location = useLocation();
  const token = getAuthToken();

  if (token && isTokenExpired(token)) {
    clearAuthToken();
  }

  const valid = token && !isTokenExpired(token);
  const { isLoading, isError } = useMeQuery(undefined, { skip: !valid });

  if (!valid || isError) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-vault-50">
        <Spinner className="size-6 text-accent" />
      </div>
    );
  }

  return <Outlet />;
}
