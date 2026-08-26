const AUTH_TOKEN_KEY = 'data-room-token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    /* private mode — session stays in memory only */
  }
}

export function clearAuthToken() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* nothing to clear */
  }
}

export function getApiBaseUrl(): string {
  // An unset *or blank* VITE_API_URL must fall back: a build that ships an
  // empty string would otherwise point every request at the web app's own
  // origin instead of the API.
  const configured = import.meta.env.VITE_API_URL?.trim();
  return configured ? configured : '/api';
}

/** JWT `exp` check so an expired session redirects instead of flashing the shell. */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = token.split('.')[1];
  if (!payload) return false;
  try {
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof decoded?.exp !== 'number') return false;
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}
