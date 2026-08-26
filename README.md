# Acme Data Room — Web

React SPA for the Data Room MVP: Drive-style browsing, uploads with real per-file
progress, sharing, a document viewer, and a read-only public link surface.

The API and the data model live in the **data-room-api** repository.

## Hosted URL

https://data-room-web-six.vercel.app

The API it talks to lives at https://data-room-api-goef.onrender.com/api — on
Render's free tier, so the first request after a quiet spell takes 30-60s to wake
the service.

## Setup

Requires Node ≥ 20.19.

```bash
cp .env.example .env          # VITE_API_URL=http://localhost:3000/api
pnpm install
pnpm dev                      # http://localhost:5173
```

Vite proxies `/api` to `localhost:3000` in development; production talks to the
deployed API directly.

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend origin **including** `/api`. Baked in at build time |

## Scripts

```bash
pnpm test          # vitest — unit + render tests
pnpm build         # tsc -b && vite build
pnpm lint
```

## Routes

| Path | Who |
| --- | --- |
| `/login`, `/register` | Guests (`?next=` returns you to the item you were opening) |
| `/` | Signed-in room list — owned and shared with you |
| `/rooms/:roomId` | Explorer at the room root |
| `/rooms/:roomId/f/:folderId` | Explorer inside a folder |
| `/rooms/:roomId/file/:fileId` | Document viewer |
| `/share/:token` | Public link — read-only landing |
| `/share/:token/f/:folderId` | Public link — browsing a nested folder |
| `/share/:token/file/:fileId` | Public link — document viewer |

`vercel.json` rewrites non-file routes to `index.html` so these survive a refresh.

## Layout

```
src/
  features/{rooms,explorer,upload,viewer,sharing,search,public,auth}
  components/{ui,layout}   shared kit
  lib/                     api client, formatting, error mapping
  store/                   RTK Query + slices
```

RTK Query owns server state and the URL owns navigation, so every view is
linkable. Uploads run outside RTK Query in an XHR worker — `fetch` cannot report
upload progress — with a three-at-a-time cap, per-file cancel and retry.
