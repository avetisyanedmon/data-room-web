import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '@/api/api';
import { ProtectedRoute } from './ProtectedRoute';

/** A signed-looking token with no `exp`, so `isTokenExpired` reads it as live. */
const LIVE_TOKEN = `header.${btoa(JSON.stringify({ sub: 'user-1' }))}.signature`;

function respond(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderGuarded() {
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/rooms/room-1']}>
        <Routes>
          <Route path="/login" element={<p>Sign in</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/rooms/:roomId" element={<p>Room contents</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('ProtectedRoute', () => {
  it('keeps the session when the server cannot be reached', async () => {
    // Arrange - a live token, and an API that is down rather than rejecting it.
    // Redirecting here would bounce off GuestRoute and loop forever.
    localStorage.setItem('data-room-token', LIVE_TOKEN);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respond(502, { message: 'Bad gateway', statusCode: 502 })),
    );

    // Act
    renderGuarded();

    // Assert
    expect(await screen.findByText(/can't reach the server/i)).toBeInTheDocument();
    expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
    expect(localStorage.getItem('data-room-token')).toBe(LIVE_TOKEN);
  });

  it('survives a network failure with no response at all', async () => {
    // Arrange - a cold start that never answers, which is what Render's free
    // tier does after a quiet spell.
    localStorage.setItem('data-room-token', LIVE_TOKEN);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    // Act
    renderGuarded();

    // Assert
    expect(await screen.findByText(/can't reach the server/i)).toBeInTheDocument();
    expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
  });

  it('retries without a reload', async () => {
    // Arrange - down once, then up
    localStorage.setItem('data-room-token', LIVE_TOKEN);
    let attempt = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        attempt += 1;
        return attempt === 1
          ? respond(500, { message: 'Internal server error', statusCode: 500 })
          : respond(200, { data: { id: 'user-1', email: 'a@b.com', name: 'Ada' } });
      }),
    );
    renderGuarded();
    const retry = await screen.findByRole('button', { name: /try again/i });

    // Act
    await userEvent.click(retry);

    // Assert
    expect(await screen.findByText('Room contents')).toBeInTheDocument();
  });

  it('ends the session when the token is actually rejected', async () => {
    // Arrange - 401 is the one status that means "this session is over"
    localStorage.setItem('data-room-token', LIVE_TOKEN);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respond(401, { message: 'Unauthorized', statusCode: 401 })),
    );

    // Act
    renderGuarded();

    // Assert
    expect(await screen.findByText('Sign in')).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem('data-room-token')).toBeNull());
  });

  it('sends a signed-out visitor straight to sign-in', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn(async () => respond(200, { data: {} })));

    // Act
    renderGuarded();

    // Assert
    expect(await screen.findByText('Sign in')).toBeInTheDocument();
  });

  it('lets a valid session through', async () => {
    // Arrange
    localStorage.setItem('data-room-token', LIVE_TOKEN);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respond(200, { data: { id: 'user-1', email: 'a@b.com', name: 'Ada' } }),
      ),
    );

    // Act
    renderGuarded();

    // Assert
    expect(await screen.findByText('Room contents')).toBeInTheDocument();
  });
});
