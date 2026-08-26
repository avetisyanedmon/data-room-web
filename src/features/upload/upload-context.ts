import { createContext, useContext } from 'react';
import type { QueueItem } from './types';

export type UploadContextValue = {
  items: QueueItem[];
  minimized: boolean;
  /** Files still waiting or in flight. */
  active: number;
  /** Byte-weighted progress across the whole queue, 0–100. */
  totalProgress: number;
  enqueue: (files: File[], roomId: string, folderId: string) => void;
  cancel: (id: string) => void;
  cancelAll: () => void;
  retry: (id: string) => void;
  dismiss: (id: string) => void;
  clearSettled: () => void;
  setMinimized: (minimized: boolean) => void;
};

export const UploadContext = createContext<UploadContextValue | null>(null);

export function useUploadQueue(): UploadContextValue {
  const context = useContext(UploadContext);
  if (!context) throw new Error('useUploadQueue must be used inside <UploadProvider>');
  return context;
}
