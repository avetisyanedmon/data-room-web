import { getApiBaseUrl, getAuthToken } from '@/lib/auth-storage';
import type { FileDto } from '@/api/data-room-api-ts/types';

type UploadArgs = {
  file: File;
  roomId: string;
  folderId: string;
  onProgress: (percent: number) => void;
  signal: (abort: () => void) => void;
};

type UploadResponse = {
  data: {
    files: FileDto[];
    errors: { name: string; message: string }[];
  };
};

export class UploadError extends Error {}
export class UploadCanceled extends Error {}

/**
 * One file per request over XMLHttpRequest.
 *
 * `fetch` (and therefore RTK Query) exposes no upload progress event, and the
 * server's multipart handler rejects batches over ten files outright — sending
 * files individually solves both and buys per-file cancel and retry.
 */
export function uploadFile({
  file,
  roomId,
  folderId,
  onProgress,
  signal,
}: UploadArgs): Promise<FileDto> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('files', file);

    const query = folderId ? `?folderId=${encodeURIComponent(folderId)}` : '';
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${getApiBaseUrl()}/data-rooms/${roomId}/files${query}`);

    const token = getAuthToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    signal(() => xhr.abort());

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        // Cap at 99 — the last percent belongs to the server's own processing.
        onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };

    xhr.onabort = () => reject(new UploadCanceled('Upload canceled'));
    xhr.onerror = () => reject(new UploadError('Network error — check your connection'));
    xhr.ontimeout = () => reject(new UploadError('Upload timed out'));

    xhr.onload = () => {
      let payload: UploadResponse | { message?: string | string[] } | undefined;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        payload = undefined;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const message = (payload as { message?: string | string[] })?.message;
        reject(
          new UploadError(
            Array.isArray(message) ? message.join(', ') : (message ?? `Upload failed (${xhr.status})`),
          ),
        );
        return;
      }

      const result = (payload as UploadResponse)?.data;
      const uploaded = result?.files?.[0];
      if (uploaded) {
        onProgress(100);
        resolve(uploaded);
        return;
      }
      reject(new UploadError(result?.errors?.[0]?.message ?? 'Upload was rejected'));
    };

    xhr.send(form);
  });
}
