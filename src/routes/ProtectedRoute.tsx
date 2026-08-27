import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PiCloudSlashBold } from 'react-icons/pi';
import { useMeQuery } from '@/api/auth-api-ts/authApi';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { clearAuthToken, getAuthToken, isTokenExpired } from '@/lib/auth-storage';
import { getErrorStatus } from '@/lib/errors';

export function ProtectedRoute() {
  const location = useLocation();
  const token = getAuthToken();

  if (token && isTokenExpired(token)) {
    clearAuthToken();
  }

  const valid = token && !isTokenExpired(token);
  const { isLoading, isError, error, refetch } = useMeQuery(undefined, { skip: !valid });

  // Only a rejected token ends a session. A 5xx, a CORS failure or a cold start
  // leaves the token perfectly good, and redirecting on those bounced straight
  // back off GuestRoute - which sends any unexpired token to "/" - and looped
  // until React gave up. The server being unreachable is its own state.
  const rejected = isError && getErrorStatus(error) === 401;

  if (!valid || rejected) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (isError) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-vault-50 p-6">
        <EmptyState
          icon={<PiCloudSlashBold />}
          title="We can't reach the server"
          description="Your session is still valid — the API just didn't answer. It may be waking up, which can take up to a minute."
          actions={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      </div>
    );
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
