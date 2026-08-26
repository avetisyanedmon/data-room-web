import { useEffect, useState } from 'react';
import { PiWarningOctagonFill } from 'react-icons/pi';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { getErrorMessage } from '@/lib/errors';
import { fetchObjectUrl, revokeObjectUrl } from '@/lib/file-transfer';

/**
 * The document itself. Bytes are fetched (the endpoint needs a bearer token
 * for the authenticated case) and handed to the browser's own PDF viewer,
 * which brings zoom, paging and text search with it.
 */
export function PdfFrame({
  path,
  name,
  authenticated,
  onUrlReady,
}: {
  path: string;
  name: string;
  authenticated: boolean;
  onUrlReady?: (url: string | null) => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const [load, setLoad] = useState<{ key: string; url?: string; error?: string }>({
    key: `${path}#${attempt}`,
  });

  const key = `${path}#${attempt}`;
  // Switching documents clears the previous one during render, so the old PDF
  // never flashes underneath the new one.
  if (load.key !== key) {
    setLoad({ key });
  }
  const { url, error } = load.key === key ? load : {};

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;

    fetchObjectUrl(path, authenticated)
      .then((next) => {
        if (!active) {
          revokeObjectUrl(next);
          return;
        }
        objectUrl = next;
        setLoad({ key, url: next });
        onUrlReady?.(next);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setLoad({ key, error: getErrorMessage(caught, 'This document could not be loaded') });
        onUrlReady?.(null);
      });

    return () => {
      active = false;
      revokeObjectUrl(objectUrl);
    };
  }, [path, authenticated, key, onUrlReady]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-white/5 text-3xl text-red-400">
          <PiWarningOctagonFill />
        </span>
        <h2 className="text-base font-semibold text-white">We couldn't open this document</h2>
        <p className="mt-1.5 max-w-sm text-[13px] text-white/50">{error}</p>
        <Button variant="dark" className="mt-6" onClick={() => setAttempt((value) => value + 1)}>
          Try again
        </Button>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-white/60">
        <Spinner className="size-6" />
        <p className="text-[13px]">Loading document…</p>
      </div>
    );
  }

  return (
    <object data={url} type="application/pdf" title={name} className="h-full w-full flex-1 bg-vault-800">
      <iframe src={url} title={name} className="h-full w-full border-0 bg-white" />
    </object>
  );
}
