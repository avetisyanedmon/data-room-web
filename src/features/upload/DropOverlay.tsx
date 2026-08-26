import { useEffect, useState } from 'react';
import { PiCloudArrowUpFill, PiFilePdfFill, PiFolderOpenFill } from 'react-icons/pi';
import { MAX_FILE_LABEL } from './types';

/**
 * Window-level drop target — Axiom 07. The previous inline dashed box only
 * accepted a drop when the pointer happened to land inside it.
 */
export function DropOverlay({
  enabled,
  destination,
  onFiles,
}: {
  enabled: boolean;
  destination: string;
  onFiles: (files: File[]) => void;
}) {
  const [active, setActive] = useState(false);

  // A viewer never sees a drop target, so clear any lingering state in render.
  if (!enabled && active) {
    setActive(false);
  }

  useEffect(() => {
    if (!enabled) return;

    let depth = 0;

    const carriesFiles = (event: DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes('Files');

    const onDragEnter = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      depth += 1;
      setActive(true);
    };

    const onDragOver = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };

    const onDragLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setActive(false);
    };

    const onDrop = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setActive(false);
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length) onFiles(files);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        depth = 0;
        setActive(false);
      }
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled, onFiles]);

  if (!enabled || !active) return null;

  return (
    <div className="animate-overlay-in fixed inset-0 z-[60] flex items-center justify-center bg-white/70 p-6 backdrop-blur-md">
      <div className="flex w-full max-w-2xl flex-col items-center rounded-3xl border-4 border-dashed border-accent bg-white p-10 text-center shadow-[var(--shadow-float)]">
        <div className="mb-6 flex size-24 items-center justify-center rounded-full border-2 border-accent/20 bg-accent-soft text-4xl text-accent">
          <PiCloudArrowUpFill />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-vault-900">Drop documents to upload</h2>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-[13px] text-vault-500">
          Files will be uploaded to
          <span className="inline-flex items-center gap-1.5 font-semibold text-vault-900">
            <PiFolderOpenFill className="text-accent" />
            {destination}
          </span>
        </p>
        <div className="mt-8 flex items-center gap-8 text-[11px] font-bold tracking-widest text-vault-400 uppercase">
          <span className="flex items-center gap-2">
            <PiFilePdfFill className="text-base" /> PDF only
          </span>
          <span>Up to {MAX_FILE_LABEL} each</span>
        </div>
        <p className="mt-8 text-[11px] font-medium tracking-[0.2em] text-vault-300 uppercase">Esc to cancel</p>
      </div>
    </div>
  );
}
