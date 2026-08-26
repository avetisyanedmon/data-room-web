import { vi } from 'vitest';

type Handler = (url: string, init?: RequestInit) => unknown;

/**
 * Routes RTK Query's fetch calls to canned payloads, matched on the first
 * pattern whose key appears in the URL. Everything the API returns is wrapped
 * in the `{ data }` envelope the real server uses.
 */
export function stubApi(routes: Record<string, Handler | unknown>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    for (const [pattern, value] of Object.entries(routes)) {
      if (!url.includes(pattern)) continue;
      const body = typeof value === 'function' ? (value as Handler)(url, init) : value;
      return new Response(JSON.stringify({ data: body }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Not stubbed', statusCode: 404 }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const NOW = '2026-08-20T10:00:00.000Z';

export const room = {
  id: 'room-1',
  name: 'Project Phoenix',
  owner: { id: 'user-1', email: 'sarah@acme.com', name: 'Sarah Jenkins' },
  itemCount: 3,
  totalSize: '5242880',
  createdAt: NOW,
  updatedAt: NOW,
  rootFolderId: 'root-1',
  entryFolderId: 'root-1',
  access: 'OWNER' as const,
};

export const folder = {
  id: 'folder-1',
  name: 'Legal',
  dataRoomId: 'room-1',
  parentId: 'root-1',
  path: '/root-1/folder-1',
  itemCount: 2,
  totalSize: '1048576',
  createdAt: NOW,
  updatedAt: NOW,
};

export const file = {
  id: 'file-1',
  name: 'Merger_Agreement_v4.pdf',
  mimeType: 'application/pdf',
  size: 4404019,
  dataRoomId: 'room-1',
  folderId: 'root-1',
  createdAt: NOW,
  updatedAt: NOW,
};

export function contents(access: 'OWNER' | 'VIEWER' = 'OWNER') {
  return {
    folder: {
      id: 'root-1',
      name: 'Project Phoenix',
      dataRoomId: 'room-1',
      parentId: null,
      path: '/root-1',
      itemCount: 3,
      totalSize: '5242880',
      createdAt: NOW,
      updatedAt: NOW,
    },
    breadcrumb: [{ id: 'root-1', name: 'Project Phoenix', parentId: null }],
    folders: [folder],
    files: [file],
    nextCursor: null,
    access,
  };
}
