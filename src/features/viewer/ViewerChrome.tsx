import type { ReactNode } from 'react';
import { PiArrowLeftBold, PiDownloadSimpleBold, PiFilePdfFill } from 'react-icons/pi';
import { Button, IconButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';

/**
 * Dark viewer shell — Vault 03 / 08. The thumbnail rail, zoom stepper and page
 * counter from the mockup are the browser's job here, so they are not faked.
 */
export function ViewerChrome({
  name,
  subtitle,
  readOnly,
  onBack,
  onDownload,
  downloading,
  children,
}: {
  name: string;
  subtitle: string;
  readOnly?: boolean;
  onBack: () => void;
  onDownload?: () => void;
  downloading?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex h-svh w-full flex-col overflow-hidden bg-vault-900 text-white">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <IconButton label="Back" variant="dark" onClick={onBack}>
            <PiArrowLeftBold />
          </IconButton>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <PiFilePdfFill className="shrink-0 text-red-500" />
              <h1 className="truncate text-[13px] font-semibold">{name}</h1>
            </div>
            <p className="truncate text-[11px] text-white/50">{subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {readOnly ? <Chip tone="dark">View only</Chip> : null}
          {onDownload ? (
            <Button
              variant="dark"
              size="sm"
              icon={<PiDownloadSimpleBold />}
              loading={downloading}
              onClick={onDownload}
            >
              <span className="hidden sm:inline">Download</span>
            </Button>
          ) : null}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
