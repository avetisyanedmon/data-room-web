import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { GuestRoute } from './GuestRoute';

/** A signed-looking token with no `exp`, so `isTokenExpired` reads it as live. */
const LIVE_TOKEN = `header.${btoa(JSON.stringify({ sub: 'user-1' }))}.signature`;

function renderAt(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<p>Sign in</p>} />
        </Route>
        <Route path="/" element={<p>Data rooms</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => localStorage.clear());

describe('GuestRoute', () => {
  it('shows sign-in to a visitor with no session', () => {
    // Arrange & Act
    renderAt('/login');

    // Assert
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('sends a signed-in user back to the app', () => {
    // Arrange
    localStorage.setItem('data-room-token', LIVE_TOKEN);

    // Act
    renderAt('/login');

    // Assert
    expect(screen.getByText('Data rooms')).toBeInTheDocument();
  });

  it('stays put when a guard sent the user here, even with a token in storage', () => {
    // Arrange - ProtectedRoute rejected this token and added ?next. Bouncing
    // back would restart the redirect that sent us here, and the two guards
    // would loop until React tore the page down to a white screen.
    localStorage.setItem('data-room-token', LIVE_TOKEN);

    // Act
    renderAt('/login?next=%2Frooms%2Froom-1');

    // Assert
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.queryByText('Data rooms')).not.toBeInTheDocument();
  });
});
