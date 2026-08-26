type ErrorLike = {
  status?: number | string;
  data?: { message?: unknown; error?: unknown };
};

export function getErrorStatus(error: unknown): number | undefined {
  const status = (error as ErrorLike | undefined)?.status;
  return typeof status === 'number' ? status : undefined;
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const message = (error as ErrorLike | undefined)?.data?.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message) && message.length) return message.join(', ');
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function isNotFound(error: unknown): boolean {
  return getErrorStatus(error) === 404;
}

export function isForbidden(error: unknown): boolean {
  return getErrorStatus(error) === 403;
}

/** A resource that vanished or was un-shared while the user was looking at it. */
export function isGoneOrDenied(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status === 403 || status === 404 || status === 410;
}
