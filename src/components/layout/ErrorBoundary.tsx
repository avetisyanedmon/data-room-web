import { Component, type ErrorInfo, type ReactNode } from 'react';
import { PiWarningOctagonFill } from 'react-icons/pi';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

type Props = { children: ReactNode };
type State = { error: Error | null };

const DESCRIPTION =
  'The page stopped rendering before it finished. Nothing you saved is lost — reloading usually clears it.';

/**
 * The app had no boundary at all, so any render error — including the
 * "Maximum update depth exceeded" React raises when two route guards redirect
 * at each other — tore down the whole root and left a white screen with no
 * clue in the UI. A crash should always say what happened and offer a way out.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-vault-50 p-6">
        <EmptyState
          icon={<PiWarningOctagonFill className="text-red-500" />}
          title="Something went wrong"
          description={DESCRIPTION}
          actions={
            <Button onClick={() => window.location.reload()}>Reload the page</Button>
          }
        />
        <code className="max-w-lg overflow-x-auto rounded-lg border border-vault-200 bg-white px-3 py-2 text-[11px] break-words text-vault-600">
          {error.message || String(error)}
        </code>
      </div>
    );
  }
}
