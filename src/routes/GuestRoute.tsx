import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken, isTokenExpired } from '@/lib/auth-storage';

export function GuestRoute() {
  const token = getAuthToken();
  if (token && !isTokenExpired(token)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
