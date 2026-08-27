import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('Cannot read properties of undefined');
}

/** A render that schedules itself forever — what a guard ping-pong looks like
 *  to React, which aborts it with "Maximum update depth exceeded". */
function RunawayLoop() {
  const [count, setCount] = useState(0);
  // eslint-disable-next-line react-hooks/set-state-in-render -- the point of the test
  setCount(count + 1);
  return <p>{count}</p>;
}

// A caught error is still reported to the console by React; keep the run quiet.
beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));
afterEach(() => vi.restoreAllMocks());

describe('ErrorBoundary', () => {
  it('renders its children while nothing is wrong', () => {
    // Arrange & Act
    render(
      <ErrorBoundary>
        <p>Data rooms</p>
      </ErrorBoundary>,
    );

    // Assert
    expect(screen.getByText('Data rooms')).toBeInTheDocument();
  });

  it('shows a recovery screen instead of a blank page when a child throws', () => {
    // Arrange & Act
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    // Assert
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });

  it('names the failure so it can be reported', () => {
    // Arrange & Act
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    // Assert
    expect(
      screen.getByText(/cannot read properties of undefined/i),
    ).toBeInTheDocument();
  });

  it('catches a runaway update loop rather than leaving an empty document', () => {
    // Arrange & Act - React aborts a loop like this with "Maximum update
    // depth exceeded", which used to unmount the whole app and leave a
    // white screen.
    render(
      <ErrorBoundary>
        <RunawayLoop />
      </ErrorBoundary>,
    );

    // Assert
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('reloads the page when asked', async () => {
    // Arrange
    const reload = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      reload,
    } as unknown as Location);
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    // Act
    await userEvent.click(screen.getByRole('button', { name: /reload/i }));

    // Assert
    expect(reload).toHaveBeenCalledOnce();
  });

  it('logs the failure for whoever has the console open', () => {
    // Arrange
    const logged = console.error as unknown as ReturnType<typeof vi.fn>;

    // Act
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    // Assert
    expect(
      logged.mock.calls.some((call: unknown[]) =>
        call.some((arg) => arg instanceof Error && /undefined/.test(arg.message)),
      ),
    ).toBe(true);
  });
});
