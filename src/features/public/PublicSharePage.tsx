import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  PiArrowLeftBold,
  PiCaretRightBold,
  PiEyeBold,
  PiFilePdfFill,
  PiFolderFill,
  PiShieldCheckFill,
} from 'react-icons/pi';
import {
  useGetPublicContentsQuery,
  useGetPublicShareQuery,
  useLazyGetPublicContentsQuery,
} from '@/api/share-api-ts/shareApi';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatBytes } from '@/lib/format';
import { RevokedPage } from './RevokedPage';

type PublicFile = { id: string; name: string; size: number; folderId: string };
type PublicFolder = { id: string; name: string };

/**
 * Vault 04, stripped of the marketing sections. A public link is a diligence
 * hand-off, not a landing page: attribution, scope, and the documents.
 */
export function PublicSharePage() {
  const { token = '', folderId: routeFolderId } = useParams();
  const navigate = useNavigate();
  const [extraFolders, setExtraFolders] = useState<PublicFolder[]>([]);
  const [extraFiles, setExtraFiles] = useState<PublicFile[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadedPage, setLoadedPage] = useState<unknown>(null);

  const { data: meta, isLoading: metaLoading, error: metaError } = useGetPublicShareQuery(token, {
    skip: !token,
  });

  // A link that points at a single file goes straight to the viewer.
  useEffect(() => {
    if (meta?.resourceType === 'FILE' && meta.file) {
      navigate(`/share/${token}/file/${meta.file.id}`, { replace: true });
    }
  }, [meta, navigate, token]);

  const folderId = routeFolderId ?? meta?.entryFolderId;
  const {
    data: contents,
    isLoading: contentsLoading,
    error: contentsError,
  } = useGetPublicContentsQuery({ token, folderId }, { skip: !token || !folderId });

  const [loadMorePage, { isFetching: loadingMore }] = useLazyGetPublicContentsQuery();

  if (contents !== loadedPage) {
    setLoadedPage(contents);
    setExtraFolders([]);
    setExtraFiles([]);
    setCursor(contents?.nextCursor ?? null);
  }

  if (metaError || contentsError) return <RevokedPage />;

  // Pages carry folders before files, so a later page can still be all folders.
  const folders = [...(contents?.folders ?? []), ...extraFolders];
  const files = [...(contents?.files ?? []), ...extraFiles];
  const atEntry = !routeFolderId || routeFolderId === meta?.entryFolderId;

  const loadMore = async () => {
    if (!cursor || !folderId) return;
    const page = await loadMorePage({ token, folderId, cursor }).unwrap();
    setExtraFolders((previous) => [...previous, ...page.folders]);
    setExtraFiles((previous) => [...previous, ...page.files]);
    setCursor(page.nextCursor);
  };

  return (
    <div className="min-h-svh bg-vault-900 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <span className="flex items-center gap-2.5 text-[15px] font-bold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
              <PiShieldCheckFill className="text-accent" />
            </span>
            Data Room
          </span>
          <div className="flex items-center gap-3">
            <Chip tone="dark" icon={<PiEyeBold />}>
              View only
            </Chip>
            <Link
              to="/login"
              className="text-[13px] font-medium text-white/60 transition-colors hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {metaLoading ? (
          <Skeleton className="h-10 w-2/3 rounded-lg" />
        ) : (
          <section className="mb-10">
            <p className="text-[11px] font-semibold tracking-[0.25em] text-white/40 uppercase">
              Shared by {meta?.dataRoom?.ownerName ?? 'the owner'}
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance">
              {meta?.resourceType === 'FOLDER' ? meta.folder?.name : meta?.dataRoom?.name}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/50">
              {meta?.resourceType === 'FOLDER'
                ? `A folder from ${meta.dataRoom?.name ?? 'a data room'}, shared read-only. You can browse and read everything inside it.`
                : 'This data room has been shared with you read-only. You can browse folders and read every document inside.'}
            </p>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
            <div className="flex min-w-0 items-center gap-2 text-[13px]">
              {atEntry ? (
                <span className="truncate font-semibold">{contents?.folder.name ?? 'Documents'}</span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/share/${token}`)}
                    className="flex items-center gap-1.5 text-white/50 transition-colors hover:text-white"
                  >
                    <PiArrowLeftBold className="text-[11px]" /> Top level
                  </button>
                  <PiCaretRightBold className="shrink-0 text-[9px] text-white/30" />
                  <span className="truncate font-semibold">{contents?.folder.name}</span>
                </>
              )}
            </div>
            <p className="text-[11px] font-medium tracking-wider text-white/40 uppercase">
              {folders.length + files.length} items
            </p>
          </div>

          {contentsLoading ? (
            <div className="space-y-4 p-6">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-10 w-full rounded-lg opacity-20" />
              ))}
            </div>
          ) : folders.length + files.length === 0 ? (
            <p className="px-6 py-16 text-center text-[13px] text-white/40">
              There are no documents in this folder yet.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {folders.map((folder) => (
                <li key={folder.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/share/${token}/f/${folder.id}`)}
                    className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-white/5"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-accent">
                      <PiFolderFill />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{folder.name}</span>
                    <PiCaretRightBold className="shrink-0 text-white/30" />
                  </button>
                </li>
              ))}

              {files.map((file) => (
                <li key={file.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/share/${token}/file/${file.id}`)}
                    className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-white/5"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-red-400">
                      <PiFilePdfFill />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{file.name}</span>
                    <span className="tabular shrink-0 text-[12px] text-white/40">
                      {formatBytes(file.size)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {cursor ? (
            <div className="border-t border-white/10 px-6 py-4 text-center">
              <Button variant="dark" size="sm" loading={loadingMore} onClick={() => void loadMore()}>
                Load more documents
              </Button>
            </div>
          ) : null}
        </section>

        <p className="mt-8 text-center text-[11px] text-white/30">
          Read-only access · you cannot upload, rename or delete anything here
        </p>
      </main>
    </div>
  );
}
