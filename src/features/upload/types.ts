export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_FILE_LABEL = '20 MB';
export const ACCEPTED_EXTENSION = '.pdf';
export const UPLOAD_CONCURRENCY = 3;

export type UploadStatus = 'waiting' | 'uploading' | 'done' | 'failed' | 'canceled';

export type QueueItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  roomId: string;
  /** Captured at enqueue time so navigating away mid-upload cannot redirect files. */
  folderId: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  /** Set when the server resolved a name collision by renaming. */
  serverName?: string;
};

export function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith(ACCEPTED_EXTENSION);
}

/** Reasons are surfaced in the queue rather than files being silently dropped. */
export function rejectionReason(file: File): string | null {
  if (!isPdf(file)) return 'Only PDF files can be uploaded';
  if (file.size > MAX_FILE_BYTES) return `Larger than the ${MAX_FILE_LABEL} limit`;
  if (file.size === 0) return 'File is empty';
  return null;
}
