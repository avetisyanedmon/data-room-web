import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { renderRoute } from '@/test/render';
import { stubApi } from '@/test/api-stub';
import { LoginPage } from './LoginPage';

const SESSION = {
  token: 'header.payload.signature',
  user: { id: 'user-1', email: 'sarah@acme.com', name: 'Sarah Jenkins' },
};

function stubFailedLogin() {
  const fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify({ message: 'Invalid credentials', statusCode: 401 }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

type RejectionListener = (reason: unknown) => void;
type RejectionEmitter = {
  on(event: 'unhandledRejection', listener: RejectionListener): void;
  off(event: 'unhandledRejection', listener: RejectionListener): void;
};

/** Collects rejections that no `.catch()` ever claimed, for the duration of a test. */
function trackUnhandledRejections() {
  // `process` is the runner's, not the app's — the app tsconfig has no node types.
  const runner = (globalThis as unknown as { process: RejectionEmitter }).process;
  const rejections: unknown[] = [];
  const collect: RejectionListener = (reason) => rejections.push(reason);
  runner.on('unhandledRejection', collect);
  return {
    rejections,
    stop: () => runner.off('unhandledRejection', collect),
  };
}

async function signIn(password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Work email'), 'sarah@acme.com');
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('submits the credentials and stores the returned token', async () => {
    // Arrange
    const fetchMock = stubApi({ '/auth/login': SESSION });
    renderRoute(<LoginPage />, { path: '/login', route: '/login' });

    // Act
    await signIn('correct-horse');

    // Assert
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [request] = fetchMock.mock.calls[0] as [Request];
    expect(await request.clone().json()).toEqual({
      email: 'sarah@acme.com',
      password: 'correct-horse',
    });
    await waitFor(() => expect(localStorage.getItem('data-room-token')).toBe(SESSION.token));
  });

  it('reports rejected credentials without raising an unhandled rejection', async () => {
    // Arrange
    stubFailedLogin();
    const tracker = trackUnhandledRejections();
    renderRoute(<LoginPage />, { path: '/login', route: '/login' });

    // Act
    await signIn('wrong-password');

    // Assert
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    tracker.stop();
    expect(tracker.rejections).toEqual([]);
    expect(localStorage.getItem('data-room-token')).toBeNull();
  });

  it('re-enables the button after a failed attempt so it can be retried', async () => {
    // Arrange
    const fetchMock = stubFailedLogin();
    renderRoute(<LoginPage />, { path: '/login', route: '/login' });

    // Act
    await signIn('wrong-password');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled());
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign in' }));

    // Assert
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
