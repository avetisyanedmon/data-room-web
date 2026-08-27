import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { getAuthToken, isTokenExpired } from '@/lib/auth-storage';

export function GuestRoute() {
  const [params] = useSearchParams();
  const token = getAuthToken();

  // `?next=` means ProtectedRoute sent the user here because it would not
  // accept the session. Bouncing an unexpired token back to "/" would hand
  // them straight to that same guard again, and the two would trade redirects
  // until React gave up and left a white screen.
  const sentByGuard = params.has('next');

  if (token && !isTokenExpired(token) && !sentByGuard) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
