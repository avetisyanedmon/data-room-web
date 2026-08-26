import { useEffect, useMemo, useRef, useState } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import {
  PiCaretRightBold,
  PiFilePdfFill,
  PiFolderFill,
  PiMagnifyingGlassBold,
} from 'react-icons/pi';
import { useSearchContentsQuery } from '@/api/data-room-api-ts/dataRoomApi';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatBytes, formatCount } from '@/lib/format';
import { cn } from '@/lib/utils';

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;
/** The API caps results server-side; say so rather than implying completeness. */
const RESULT_CAP = 25;

type Result =
  | { kind: 'folder'; id: string; name: string; meta: string }
  | { kind: 'file'; id: string; name: string; meta: string };

/**
 * In-room command palette — Vault 09 / 10. Scoped to one data room because
 * `GET /data-rooms/:id/search` is; the mockup's cross-room framing, filter
 * chips and result pager have no endpoint behind them.
 */
export function SearchPalette({
  open,
  onOpenChange,
  roomId,
  onOpenFolder,
  onOpenFile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  onOpenFolder: (id: string) => void;
  onOpenFile: (id: string) => void;
}) {
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [active, setActive] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  const listRef = useRef<HTMLUListElement>(null);

  // Each opening starts from an empty query, reset during render.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setTerm('');
      setDebounced('');
      setActive(0);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  const enabled = debounced.length >= MIN_QUERY;
  const { data, isFetching } = useSearchContentsQuery(
    { roomId, q: debounced },
    { skip: !open || !enabled },
  );

  const results = useMemo<Result[]>(() => {
    if (!data) return [];
    return [
      ...data.folders.map((folder) => ({
        kind: 'folder' as const,
        id: folder.id,
        name: folder.name,
        meta: `Folder · ${formatCount(folder.itemCount, 'item')}`,
      })),
      ...data.files.map((file) => ({
        kind: 'file' as const,
        id: file.id,
        name: file.name,
        meta: `PDF · ${formatBytes(file.size)}`,
      })),
    ];
  }, [data]);

  // Keep the highlight inside the current result set without an effect.
  const activeIndex = active < results.length ? active : 0;

  const openResult = (result: Result) => {
    onOpenChange(false);
    if (result.kind === 'folder') onOpenFolder(result.id);
    else onOpenFile(result.id);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((activeIndex + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((activeIndex - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const result = results[activeIndex];
      if (result) openResult(result);
    }
  };

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="animate-overlay-in fixed inset-0 z-50 bg-vault-900/40 backdrop-blur-[3px]" />
        <RadixDialog.Content
          onKeyDown={onKeyDown}
          className="animate-fade-up fixed top-24 left-1/2 z-50 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-float)]"
        >
          <RadixDialog.Title className="sr-only">Search this data room</RadixDialog.Title>
          <RadixDialog.Description className="sr-only">
            Find folders and documents by name. Use the arrow keys to move between results.
          </RadixDialog.Description>

          <div className="flex items-center gap-3 border-b border-vault-100 px-4 py-3.5">
            <PiMagnifyingGlassBold className="shrink-0 text-xl text-vault-400" />
            <input
              autoFocus
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search folders and documents…"
              aria-label="Search this data room"
              className="min-w-0 flex-1 border-none bg-transparent text-base text-vault-900 outline-none placeholder:text-vault-400"
            />
            <kbd className="hidden rounded border border-vault-200 bg-vault-50 px-1.5 py-0.5 text-[10px] font-bold text-vault-400 sm:inline">
              ESC
            </kbd>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {!enabled ? (
              <p className="px-6 py-12 text-center text-[13px] text-vault-400">
                Type at least {MIN_QUERY} characters to search this data room.
              </p>
            ) : isFetching && results.length === 0 ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex items-center gap-4">
                    <Skeleton className="size-10 shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-vault-50 text-3xl text-vault-200">
                  <PiMagnifyingGlassBold />
                </div>
                <h3 className="text-base font-semibold text-vault-900">
                  No documents found for "{debounced}"
                </h3>
                <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-vault-500">
                  Check the spelling, or try a broader term — search matches folder and file names in
                  this data room.
                </p>
              </div>
            ) : (
              <ul ref={listRef}>
                {results.map((result, index) => (
                  <li key={`${result.kind}-${result.id}`}>
                    <button
                      type="button"
                      data-index={index}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => openResult(result)}
                      className={cn(
                        'flex w-full items-center gap-4 border-l-4 px-6 py-3.5 text-left transition-colors',
                        index === activeIndex
                          ? 'border-vault-900 bg-vault-50'
                          : 'border-transparent hover:bg-vault-50/60',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-xl text-xl',
                          result.kind === 'folder'
                            ? 'bg-vault-900 text-white'
                            : 'bg-red-50 text-red-600',
                        )}
                      >
                        {result.kind === 'folder' ? <PiFolderFill /> : <PiFilePdfFill />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-vault-900">
                          {result.name}
                        </span>
                        <span className="block truncate text-[11px] text-vault-500">{result.meta}</span>
                      </span>
                      <PiCaretRightBold className="shrink-0 text-vault-300" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-vault-100 bg-vault-50 px-5 py-2.5">
            <div className="flex items-center gap-4 text-[10px] font-medium text-vault-500">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-vault-200 bg-white px-1.5 py-0.5 font-bold">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-vault-200 bg-white px-1.5 py-0.5 font-bold">↵</kbd>
                Open
              </span>
            </div>
            {results.length > 0 ? (
              <p className="tabular text-[10px] font-medium text-vault-400">
                {results.length >= RESULT_CAP * 2
                  ? `First ${results.length} matches`
                  : `${results.length} ${results.length === 1 ? 'match' : 'matches'}`}
              </p>
            ) : null}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
