import { act, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/api/api';
import { UploadProvider } from './UploadProvider';
import { useUploadQueue } from './upload-context';
import { UPLOAD_CONCURRENCY } from './types';

/** Minimal XMLHttpRequest stand-in the tests drive by hand. */
class FakeXhr {
  static instances: FakeXhr[] = [];

  status = 200;
  responseText = '';
  aborted = false;
  upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  ontimeout: (() => void) | null = null;

  open() {}
  setRequestHeader() {}

  send() {
    FakeXhr.instances.push(this);
  }

  abort() {
    this.aborted = true;
    this.onabort?.();
  }

  emitProgress(loaded: number, total: number) {
    this.upload.onprogress?.({ lengthComputable: true, loaded, total } as ProgressEvent);
  }

  succeed(name: string) {
    this.status = 201;
    this.responseText = JSON.stringify({
      data: { files: [{ id: `id-${name}`, name, size: 10 }], errors: [] },
    });
    this.onload?.();
  }

  fail(status: number, message: string) {
    this.status = status;
    this.responseText = JSON.stringify({ message, statusCode: status });
    this.onload?.();
  }
}

function pdf(name: string, size = 1024): File {
  const file = new File(['%PDF-1.4'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

let queue: ReturnType<typeof useUploadQueue>;

/** Publishes the live queue API to the test after each commit. */
function Harness({ onReady }: { onReady: (value: ReturnType<typeof useUploadQueue>) => void }) {
  const value = useUploadQueue();

  useEffect(() => {
    onReady(value);
  }, [onReady, value]);

  return (
    <ul>
      {value.items.map((item) => (
        <li key={item.id} data-testid={item.name}>
          {item.status}:{item.progress}:{item.error ?? ''}:{item.serverName ?? ''}
        </li>
      ))}
    </ul>
  );
}

function renderQueue() {
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });
  return render(
    <Provider store={store}>
      <UploadProvider>
        <Harness
          onReady={(value) => {
            queue = value;
          }}
        />
      </UploadProvider>
    </Provider>,
  );
}

function row(name: string) {
  return screen.getByTestId(name).textContent ?? '';
}

beforeEach(() => {
  FakeXhr.instances = [];
  vi.stubGlobal('XMLHttpRequest', FakeXhr);
});

afterEach(() => vi.unstubAllGlobals());

describe('upload queue', () => {
  it('uploads one file per request and caps how many run at once', async () => {
    renderQueue();

    act(() => {
      queue.enqueue(
        ['a.pdf', 'b.pdf', 'c.pdf', 'd.pdf', 'e.pdf'].map((name) => pdf(name)),
        'room-1',
        'folder-1',
      );
    });

    // Five files, three requests: the rest wait their turn.
    await waitFor(() => expect(FakeXhr.instances).toHaveLength(UPLOAD_CONCURRENCY));
    expect(row('d.pdf')).toContain('waiting');
    expect(row('e.pdf')).toContain('waiting');

    act(() => FakeXhr.instances[0].succeed('a.pdf'));
    await waitFor(() => expect(FakeXhr.instances).toHaveLength(UPLOAD_CONCURRENCY + 1));
  });

  it('reports real progress from the request', async () => {
    renderQueue();
    act(() => queue.enqueue([pdf('report.pdf')], 'room-1', 'folder-1'));
    await waitFor(() => expect(FakeXhr.instances).toHaveLength(1));

    act(() => FakeXhr.instances[0].emitProgress(50, 100));
    await waitFor(() => expect(row('report.pdf')).toContain('uploading:50'));

    // The last percent is held back for the server's own processing.
    act(() => FakeXhr.instances[0].emitProgress(100, 100));
    await waitFor(() => expect(row('report.pdf')).toContain('uploading:99'));

    act(() => FakeXhr.instances[0].succeed('report.pdf'));
    await waitFor(() => expect(row('report.pdf')).toContain('done:100'));
  });

  it('surfaces the name the server actually saved on a collision', async () => {
    renderQueue();
    act(() => queue.enqueue([pdf('Q4.pdf')], 'room-1', 'folder-1'));
    await waitFor(() => expect(FakeXhr.instances).toHaveLength(1));

    act(() => FakeXhr.instances[0].succeed('Q4 (2).pdf'));
    await waitFor(() => expect(row('Q4.pdf')).toContain('Q4 (2).pdf'));
  });

  it('rejects a non-PDF before it leaves the browser', async () => {
    renderQueue();
    const notPdf = new File(['x'], 'notes.txt', { type: 'text/plain' });

    act(() => queue.enqueue([notPdf], 'room-1', 'folder-1'));

    await waitFor(() => expect(row('notes.txt')).toContain('Only PDF files can be uploaded'));
    expect(FakeXhr.instances).toHaveLength(0);
  });

  it('keeps a failed upload retryable with its stated reason', async () => {
    renderQueue();
    act(() => queue.enqueue([pdf('huge.pdf')], 'room-1', 'folder-1'));
    await waitFor(() => expect(FakeXhr.instances).toHaveLength(1));

    act(() => FakeXhr.instances[0].fail(413, 'Each PDF must be 20MB or smaller'));
    await waitFor(() => expect(row('huge.pdf')).toContain('Each PDF must be 20MB or smaller'));

    const id = queue.items[0].id;
    act(() => queue.retry(id));
    await waitFor(() => expect(FakeXhr.instances).toHaveLength(2));
  });

  it('cancels an upload in flight without failing it', async () => {
    renderQueue();
    act(() => queue.enqueue([pdf('slow.pdf')], 'room-1', 'folder-1'));
    await waitFor(() => expect(FakeXhr.instances).toHaveLength(1));

    act(() => queue.cancel(queue.items[0].id));

    expect(FakeXhr.instances[0].aborted).toBe(true);
    await waitFor(() => expect(row('slow.pdf')).toContain('canceled'));
  });
});
