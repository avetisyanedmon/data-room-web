import { useEffect, useRef, useState } from 'react';
import { PiCheckBold, PiFolderFill, PiWarningCircleFill, PiXBold } from 'react-icons/pi';
import { IconButton } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Inline folder creation with live collision feedback — Vault 01 / 12.
 * Replaces the window.prompt() the page used to rely on.
 */
export function InlineCreateRow({
  takenNames,
  loading,
  onCancel,
  onSubmit,
}: {
  takenNames: string[];
  loading: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState('Untitled folder');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const trimmed = name.trim();
  const collides = takenNames.some((taken) => taken.toLowerCase() === trimmed.toLowerCase());
  const empty = trimmed.length === 0;

  const submit = () => {
    if (empty || loading) return;
    onSubmit(trimmed);
  };

  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-4 bg-accent-soft/40 px-5 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-vault-900 text-white">
          <PiFolderFill className="text-lg" />
        </span>
        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            value={name}
            disabled={loading}
            aria-label="New folder name"
            aria-invalid={collides || empty}
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                onCancel();
              }
            }}
            className={cnInput(collides || empty)}
          />
          {empty ? (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-600">
              <PiWarningCircleFill /> Give the folder a name
            </p>
          ) : collides ? (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-amber-700">
              <PiWarningCircleFill /> A folder named "{trimmed}" already exists here — this one will be
              saved as "{trimmed} (2)"
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] text-vault-500">Press Enter to create, Esc to cancel</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {loading ? (
          <Spinner className="size-4 text-accent" />
        ) : (
          <>
            <IconButton label="Create folder" disabled={empty} onClick={submit}>
              <PiCheckBold className="text-emerald-600" />
            </IconButton>
            <IconButton label="Cancel" onClick={onCancel}>
              <PiXBold />
            </IconButton>
          </>
        )}
      </div>
    </div>
  );
}

function cnInput(invalid: boolean) {
  return [
    'w-full max-w-sm rounded-md border bg-white px-2.5 py-1.5 text-[13px] font-semibold text-vault-900 outline-none',
    invalid
      ? 'border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15'
      : 'border-accent/40 focus:border-accent focus:ring-2 focus:ring-accent/15',
  ].join(' ');
}
