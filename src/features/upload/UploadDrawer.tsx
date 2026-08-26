import { PiCaretDownBold, PiCaretUpBold, PiCloudArrowUpFill } from 'react-icons/pi';
import { Button, IconButton } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useUploadQueue } from './upload-context';
import { UploadRow } from './UploadRow';

/**
 * Persistent upload queue — Axiom 05. Lives above the router so it keeps
 * running while the user browses elsewhere.
 */
export function UploadDrawer() {
  const { items, minimized, active, totalProgress, cancel, cancelAll, retry, dismiss, clearSettled, setMinimized } =
    useUploadQueue();

  if (items.length === 0) return null;

  const completed = items.filter((item) => item.status === 'done').length;
  const failed = items.filter((item) => item.status === 'failed').length;

  return (
    <section
      aria-label="Upload queue"
      className="animate-fade-up fixed right-0 bottom-0 z-40 w-full border-t border-vault-100 bg-white shadow-[var(--shadow-float)] sm:right-6 sm:bottom-6 sm:w-[26rem] sm:rounded-2xl sm:border"
    >
      <header className="flex items-center justify-between gap-3 rounded-t-2xl bg-vault-900 px-4 py-3 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <PiCloudArrowUpFill />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-[13px] font-semibold">
              {active > 0 ? `Uploading ${active} ${active === 1 ? 'file' : 'files'}` : 'Uploads'}
            </h2>
            <p className="tabular text-[10px] font-medium tracking-widest text-white/60 uppercase">
              {completed} of {items.length} completed{failed > 0 ? ` · ${failed} failed` : ''}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            label={minimized ? 'Expand upload queue' : 'Minimize upload queue'}
            variant="dark"
            onClick={() => setMinimized(!minimized)}
          >
            {minimized ? <PiCaretUpBold className="text-xs" /> : <PiCaretDownBold className="text-xs" />}
          </IconButton>
        </div>
      </header>

      {active > 0 ? (
        <div className="border-b border-vault-100 bg-vault-50 px-4 py-2.5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wide text-vault-500 uppercase">Total progress</span>
            <span className="tabular text-[11px] font-bold text-vault-900">{totalProgress}%</span>
          </div>
          <ProgressBar value={totalProgress} tone="dark" striped label="Total upload progress" />
        </div>
      ) : null}

      {!minimized ? (
        <>
          <ul
            aria-live="polite"
            className="max-h-[min(24rem,45vh)] divide-y divide-vault-100 overflow-y-auto"
          >
            {items.map((item) => (
              <UploadRow
                key={item.id}
                item={item}
                onCancel={cancel}
                onRetry={retry}
                onDismiss={dismiss}
              />
            ))}
          </ul>

          <footer className="flex items-center justify-between gap-2 border-t border-vault-100 bg-vault-50 px-4 py-3 sm:rounded-b-2xl">
            <p className="text-[11px] text-vault-500 italic">
              {active > 0 ? 'Keep this page open until uploads finish' : 'All uploads finished'}
            </p>
            <div className="flex shrink-0 gap-2">
              {active > 0 ? (
                <Button size="sm" variant="secondary" onClick={cancelAll}>
                  Cancel all
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={clearSettled}>
                  Clear
                </Button>
              )}
            </div>
          </footer>
        </>
      ) : null}
    </section>
  );
}
