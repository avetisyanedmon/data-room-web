import { getApiBaseUrl, getAuthToken } from './auth-storage';

/**
 * PDF endpoints stream `inline` behind a bearer token, so the browser cannot be
 * pointed straight at them — fetch the bytes and hand back an object URL.
 */
export async function fetchObjectUrl(path: string, authenticated = true): Promise<string> {
  const headers = new Headers();
  if (authenticated) {
    const token = getAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, { headers });
  if (!response.ok) {
    const error = new Error('Unable to load this document') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return URL.createObjectURL(await response.blob());
}

export function revokeObjectUrl(url: string | undefined) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

/** The content endpoint serves `inline`; saving is done client-side. */
export function saveObjectUrl(url: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
