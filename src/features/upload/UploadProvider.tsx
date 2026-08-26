import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { api } from '@/api/api';
import { UploadCanceled, uploadFile } from './uploadFile';
import { UPLOAD_CONCURRENCY, rejectionReason, type QueueItem } from './types';
import { UploadContext, type UploadContextValue } from './upload-context';

type State = {
  items: QueueItem[];
  minimized: boolean;
};

type Action =
  | { type: 'enqueue'; items: QueueItem[] }
  | { type: 'start'; id: string }
  | { type: 'progress'; id: string; progress: number }
  | { type: 'done'; id: string; serverName: string }
  | { type: 'fail'; id: string; error: string }
  | { type: 'cancel'; id: string }
  | { type: 'retry'; id: string }
  | { type: 'dismiss'; id: string }
  | { type: 'clearSettled' }
  | { type: 'cancelAll' }
  | { type: 'minimize'; minimized: boolean };

const SETTLED: QueueItem['status'][] = ['done', 'failed', 'canceled'];

function patch(state: State, id: string, changes: Partial<QueueItem>): State {
  return {
    ...state,
    items: state.items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'enqueue':
      return { items: [...state.items, ...action.items], minimized: false };
    case 'start':
      return patch(state, action.id, { status: 'uploading', progress: 0, error: undefined });
    case 'progress':
      return patch(state, action.id, { progress: action.progress });
    case 'done':
      return patch(state, action.id, { status: 'done', progress: 100, serverName: action.serverName });
    case 'fail':
      return patch(state, action.id, { status: 'failed', error: action.error });
    case 'cancel':
      return patch(state, action.id, { status: 'canceled', error: 'Canceled' });
    case 'retry':
      return patch(state, action.id, { status: 'waiting', progress: 0, error: undefined });
    case 'dismiss':
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };
    case 'clearSettled':
      return { ...state, items: state.items.filter((item) => !SETTLED.includes(item.status)) };
    case 'cancelAll':
      return {
        ...state,
        items: state.items.map((item) =>
          item.status === 'waiting' || item.status === 'uploading'
            ? { ...item, status: 'canceled', error: 'Canceled' }
            : item,
        ),
      };
    case 'minimize':
      return { ...state, minimized: action.minimized };
    default:
      return state;
  }
}

export function UploadProvider({ children }: { children: ReactNode }) {
  const [state, send] = useReducer(reducer, { items: [], minimized: false });
  const dispatch = useDispatch();

  const abortsRef = useRef(new Map<string, () => void>());
  const startedRef = useRef(new Set<string>());
  const touchedRef = useRef(new Set<string>());
  const summaryRef = useRef<{ uploaded: number; renamed: [string, string][]; failed: number }>({
    uploaded: 0,
    renamed: [],
    failed: 0,
  });

  const enqueue = useCallback((files: File[], roomId: string, folderId: string) => {
    if (files.length === 0) return;

    const items: QueueItem[] = files.map((file) => {
      const reason = rejectionReason(file);
      return {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        roomId,
        folderId,
        status: reason ? 'failed' : 'waiting',
        progress: 0,
        error: reason ?? undefined,
      };
    });

    send({ type: 'enqueue', items });
  }, []);

  const cancel = useCallback((id: string) => {
    abortsRef.current.get(id)?.();
    abortsRef.current.delete(id);
    send({ type: 'cancel', id });
  }, []);

  const cancelAll = useCallback(() => {
    abortsRef.current.forEach((abort) => abort());
    abortsRef.current.clear();
    send({ type: 'cancelAll' });
  }, []);

  const retry = useCallback((id: string) => {
    startedRef.current.delete(id);
    send({ type: 'retry', id });
  }, []);

  // Queue runner: keeps `UPLOAD_CONCURRENCY` requests in flight.
  useEffect(() => {
    const active = state.items.filter((item) => item.status === 'uploading').length;
    const next = state.items
      .filter((item) => item.status === 'waiting' && !startedRef.current.has(item.id))
      .slice(0, Math.max(0, UPLOAD_CONCURRENCY - active));

    next.forEach((item) => {
      startedRef.current.add(item.id);
      touchedRef.current.add(`${item.roomId}::${item.folderId}`);
      send({ type: 'start', id: item.id });

      void uploadFile({
        file: item.file,
        roomId: item.roomId,
        folderId: item.folderId,
        onProgress: (progress) => send({ type: 'progress', id: item.id, progress }),
        signal: (abort) => abortsRef.current.set(item.id, abort),
      })
        .then((uploaded) => {
          summaryRef.current.uploaded += 1;
          if (uploaded.name !== item.name) {
            summaryRef.current.renamed.push([item.name, uploaded.name]);
          }
          send({ type: 'done', id: item.id, serverName: uploaded.name });
        })
        .catch((error: unknown) => {
          if (error instanceof UploadCanceled) return;
          summaryRef.current.failed += 1;
          send({
            type: 'fail',
            id: item.id,
            error: error instanceof Error ? error.message : 'Upload failed',
          });
        })
        .finally(() => {
          abortsRef.current.delete(item.id);
        });
    });
  }, [state.items]);

  // Batch settled: refresh the affected folders once, then report the outcome.
  const inFlight = state.items.some(
    (item) => item.status === 'waiting' || item.status === 'uploading',
  );

  useEffect(() => {
    if (inFlight || touchedRef.current.size === 0) return;

    dispatch(api.util.invalidateTags(['Contents', 'DataRoom']));
    touchedRef.current.clear();

    const { uploaded, renamed, failed } = summaryRef.current;
    summaryRef.current = { uploaded: 0, renamed: [], failed: 0 };

    if (uploaded > 0) {
      toast.success(`${uploaded} ${uploaded === 1 ? 'file' : 'files'} uploaded`, {
        description:
          failed > 0 ? `${failed} ${failed === 1 ? 'file' : 'files'} failed — retry from the queue` : undefined,
      });
    } else if (failed > 0) {
      toast.error(`${failed} ${failed === 1 ? 'upload' : 'uploads'} failed`, {
        description: 'Open the upload queue to see why and retry.',
      });
    }

    // The API resolves name collisions by renaming; say so rather than
    // showing the user a name they did not choose.
    if (renamed.length > 0) {
      toast.warning(
        `${renamed.length} ${renamed.length === 1 ? 'file was' : 'files were'} renamed to avoid overwriting`,
        {
          description: renamed
            .slice(0, 3)
            .map(([from, to]) => `${from} → ${to}`)
            .join('\n'),
          duration: 8000,
        },
      );
    }
  }, [inFlight, dispatch]);

  // "Keep this page open" — enforced rather than merely suggested.
  useEffect(() => {
    if (!inFlight) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [inFlight]);

  const value = useMemo<UploadContextValue>(() => {
    const active = state.items.filter(
      (item) => item.status === 'uploading' || item.status === 'waiting',
    ).length;

    // Byte-weighted so one large PDF among small ones does not make the bar lurch.
    const tracked = state.items.filter((item) => item.status !== 'canceled');
    const totalBytes = tracked.reduce((sum, item) => sum + Math.max(item.size, 1), 0);
    const doneBytes = tracked.reduce(
      (sum, item) => sum + Math.max(item.size, 1) * (item.status === 'done' ? 100 : item.progress) / 100,
      0,
    );

    return {
      items: state.items,
      minimized: state.minimized,
      active,
      totalProgress: totalBytes === 0 ? 0 : Math.round((doneBytes / totalBytes) * 100),
      enqueue,
      cancel,
      cancelAll,
      retry,
      dismiss: (id: string) => send({ type: 'dismiss', id }),
      clearSettled: () => send({ type: 'clearSettled' }),
      setMinimized: (minimized: boolean) => send({ type: 'minimize', minimized }),
    };
  }, [state.items, state.minimized, enqueue, cancel, cancelAll, retry]);

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
}
