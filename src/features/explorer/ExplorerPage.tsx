import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  PiCloudArrowUpFill,
  PiFolderPlusBold,
  PiFolderSimpleFill,
  PiLinkBreakBold,
  PiWarningOctagonFill,
} from 'react-icons/pi';
import {
  useCreateFolderMutation,
  useDeleteFileMutation,
  useDeleteFolderMutation,
  useGetContentsQuery,
  useGetDataRoomQuery,
  useLazyGetContentsQuery,
  useMoveFileMutation,
  useRenameFileMutation,
  useRenameFolderMutation,
} from '@/api/data-room-api-ts/dataRoomApi';
import type { FileDto, FolderDto } from '@/api/data-room-api-ts/types';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { getErrorMessage, isForbidden, isGoneOrDenied } from '@/lib/errors';
import { fetchObjectUrl, revokeObjectUrl, saveObjectUrl } from '@/lib/file-transfer';
import { DropOverlay } from '@/features/upload/DropOverlay';
import { useUploadQueue } from '@/features/upload/upload-context';
import { ACCEPTED_EXTENSION } from '@/features/upload/types';
import { SearchPalette } from '@/features/search/SearchPalette';
import { WrongAccountPage } from '@/features/public/WrongAccountPage';
import { ShareDialog } from '@/features/sharing/ShareDialog';
import { DeleteFolderDialog } from './DeleteFolderDialog';
import { DetailsPanel, type DetailsTarget } from './DetailsPanel';
import { ExplorerSkeleton } from './ExplorerSkeleton';
import { FileRow } from './FileRow';
import { FolderRow } from './FolderRow';
import { InlineCreateRow } from './InlineCreateRow';
import { ListFooter } from './ListFooter';
import { MoveDialog } from './MoveDialog';
import { RenameDialog } from './RenameDialog';
import { Toolbar } from './Toolbar';

type ShareTarget = {
  resourceType: 'DATA_ROOM' | 'FOLDER' | 'FILE';
  resourceId: string;
  resourceName: string;
};

export function ExplorerPage() {
  const { roomId = '', folderId: routeFolderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueue } = useUploadQueue();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [creating, setCreating] = useState(false);
  const [renameFolderTarget, setRenameFolderTarget] = useState<FolderDto | null>(null);
  const [renameFileTarget, setRenameFileTarget] = useState<FileDto | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderDto | null>(null);
  const [deleteFileTarget, setDeleteFileTarget] = useState<FileDto | null>(null);
  const [moveTarget, setMoveTarget] = useState<FileDto | null>(null);
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [extraFolders, setExtraFolders] = useState<FolderDto[]>([]);
  const [extraFiles, setExtraFiles] = useState<FileDto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadedPage, setLoadedPage] = useState<unknown>(null);

  const { data: room, isLoading: roomLoading, error: roomError } = useGetDataRoomQuery(roomId, {
    skip: !roomId,
  });

  const folderId = routeFolderId ?? room?.entryFolderId;
  const {
    data: contents,
    isLoading: contentsLoading,
    isFetching,
    error: contentsError,
  } = useGetContentsQuery({ roomId, folderId }, { skip: !roomId || !folderId });

  const [loadMorePage, { isFetching: loadingMore }] = useLazyGetContentsQuery();
  const [createFolder, { isLoading: creatingFolder }] = useCreateFolderMutation();
  const [renameFolder, { isLoading: renamingFolder }] = useRenameFolderMutation();
  const [renameFile, { isLoading: renamingFile }] = useRenameFileMutation();
  const [deleteFolder, { isLoading: deletingFolder }] = useDeleteFolderMutation();
  const [deleteFile, { isLoading: deletingFile }] = useDeleteFileMutation();
  const [moveFile, { isLoading: movingFile }] = useMoveFileMutation();

  const canManage = contents?.access === 'OWNER';
  const pageFolders = contents?.folders;
  const pageFiles = contents?.files;

  // Pages carry folders before files, so a later page can still be all folders.
  const folders = useMemo(
    () => [...(pageFolders ?? []), ...extraFolders],
    [pageFolders, extraFolders],
  );
  // First page from the cache, plus any pages pulled in with Load more.
  const files = useMemo(() => [...(pageFiles ?? []), ...extraFiles], [pageFiles, extraFiles]);
  const rows = useMemo(
    () => [
      ...folders.map((folder) => ({ kind: 'folder' as const, id: folder.id, folder })),
      ...files.map((file) => ({ kind: 'file' as const, id: file.id, file })),
    ],
    [folders, files],
  );

  // A fresh page of contents resets accumulated pages (folder change, or a
  // mutation invalidating the cache). Done during render so the list never
  // paints one folder's files against another folder's header.
  if (contents !== loadedPage) {
    setLoadedPage(contents);
    setExtraFolders([]);
    setExtraFiles([]);
    setCursor(contents?.nextCursor ?? null);
    setActiveId(null);
  }

  // The details panel follows the active row; deriving it means no effect and
  // no chance of the panel describing a row that has since been deleted.
  const activeRow = rows.find((row) => row.id === activeId);
  const details: DetailsTarget = activeRow
    ? activeRow.kind === 'folder'
      ? { kind: 'folder', folder: activeRow.folder }
      : { kind: 'file', file: activeRow.file }
    : null;

  const openFile = useCallback(
    (file: FileDto) => navigate(`/rooms/${roomId}/file/${file.id}`),
    [navigate, roomId],
  );

  const handleUploadFiles = useCallback(
    (selected: File[]) => {
      if (!canManage || !folderId) return;
      enqueue(selected, roomId, folderId);
    },
    [canManage, enqueue, folderId, roomId],
  );

  const loadMore = async () => {
    if (!cursor || !folderId) return;
    try {
      const page = await loadMorePage({ roomId, folderId, cursor }).unwrap();
      setExtraFolders((previous) => [...previous, ...page.folders]);
      setExtraFiles((previous) => [...previous, ...page.files]);
      setCursor(page.nextCursor);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to load more items'));
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const folder = await createFolder({ roomId, body: { name, parentId: folderId } }).unwrap();
      setCreating(false);
      toast.success(
        folder.name === name ? `Folder "${folder.name}" created` : `Saved as "${folder.name}"`,
        {
          description:
            folder.name === name ? undefined : 'A folder with that name already existed here.',
        },
      );
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to create the folder'));
    }
  };

  const handleMove = async (fileId: string, destinationId: string, fileName: string) => {
    try {
      const moved = await moveFile({ id: fileId, body: { folderId: destinationId } }).unwrap();
      setMoveTarget(null);
      toast.success(
        moved.name === fileName ? `"${fileName}" moved` : `Moved and renamed to "${moved.name}"`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to move the file'));
    }
  };

  const handleDownload = async (file: FileDto) => {
    const toastId = toast.loading(`Preparing "${file.name}"…`);
    try {
      const url = await fetchObjectUrl(`/files/${file.id}/content`);
      saveObjectUrl(url, file.name);
      revokeObjectUrl(url);
      toast.success('Download started', { id: toastId });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to download this file'), { id: toastId });
    }
  };

  // Keyboard: ⌘K opens search, arrows move the active row, Enter opens it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
      if (rows.length === 0) return;

      const current = rows.findIndex((row) => row.id === activeId);

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveId(rows[Math.min(rows.length - 1, current + 1)]?.id ?? null);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveId(rows[Math.max(0, current - 1)]?.id ?? null);
      } else if (event.key === 'Enter' && current >= 0) {
        const row = rows[current];
        if (!row) return;
        event.preventDefault();
        if (row.kind === 'folder') navigate(`/rooms/${roomId}/f/${row.folder.id}`);
        else openFile(row.file);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeId, navigate, openFile, roomId, rows]);

  const error = roomError ?? contentsError;

  // 403 means the resource exists but was never shared with this account —
  // a different problem, and a different screen, from 404.
  if (error && isForbidden(error)) {
    return <WrongAccountPage returnTo={location.pathname} />;
  }

  if (error && isGoneOrDenied(error)) {
    const denied = !roomError && contentsError;
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState
          icon={<PiLinkBreakBold />}
          title={denied ? 'This folder is no longer available' : 'This data room is no longer available'}
          description={
            denied
              ? 'It was deleted or un-shared by the owner while you were viewing it.'
              : 'It may have been deleted, or your access was revoked.'
          }
          actions={
            <>
              <Button variant="secondary" onClick={() => navigate('/')}>
                All data rooms
              </Button>
              {denied ? <Button onClick={() => navigate(`/rooms/${roomId}`)}>Back to room root</Button> : null}
            </>
          }
        />
      </div>
    );
  }

  if (roomLoading || (contentsLoading && !contents)) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <ExplorerSkeleton />
      </div>
    );
  }

  if (!room || !contents) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState
          icon={<PiWarningOctagonFill />}
          title="We couldn't open this data room"
          description="The server didn't respond as expected. Try again in a moment."
          actions={<Button onClick={() => navigate('/')}>All data rooms</Button>}
        />
      </div>
    );
  }

  const takenFolderNames = folders.map((folder) => folder.name);
  const isEmpty = rows.length === 0 && !creating;
  const atRoot = contents.folder.id === room.rootFolderId;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Toolbar
        roomId={roomId}
        roomName={room.name}
        breadcrumb={contents.breadcrumb}
        canManage={canManage}
        detailsOpen={detailsOpen}
        onNewFolder={() => setCreating(true)}
        onUpload={() => fileInputRef.current?.click()}
        onSearch={() => setSearchOpen(true)}
        onToggleDetails={() => setDetailsOpen((open) => !open)}
      />

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto p-6">
          <div className="overflow-hidden rounded-xl border border-vault-100 bg-white shadow-[var(--shadow-panel)]">
            <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-vault-100 bg-vault-50/70 px-5 py-2.5 text-[10px] font-semibold tracking-widest text-vault-500 uppercase sm:grid-cols-[1fr_5rem_9rem_auto] lg:grid-cols-[1fr_7rem_5rem_9rem_auto]">
              <div>Name</div>
              <div className="hidden lg:block">Type</div>
              <div className="hidden sm:block">Size</div>
              <div className="hidden sm:block">Modified</div>
              <div className="w-8" />
            </div>

            {creating ? (
              <InlineCreateRow
                takenNames={takenFolderNames}
                loading={creatingFolder}
                onCancel={() => setCreating(false)}
                onSubmit={(name) => void handleCreateFolder(name)}
              />
            ) : null}

            {isEmpty ? (
              <EmptyState
                compact
                icon={<PiFolderSimpleFill />}
                title={atRoot ? 'This data room is empty' : 'This folder is empty'}
                description={
                  canManage
                    ? 'Upload PDFs or create a folder structure to get started. You can also drag files anywhere on this page.'
                    : 'The owner has not added any documents here yet.'
                }
                actions={
                  canManage ? (
                    <>
                      <Button icon={<PiCloudArrowUpFill />} onClick={() => fileInputRef.current?.click()}>
                        Upload files
                      </Button>
                      <Button
                        variant="secondary"
                        icon={<PiFolderPlusBold />}
                        onClick={() => setCreating(true)}
                      >
                        Create folder
                      </Button>
                    </>
                  ) : null
                }
              />
            ) : (
              <div role="rowgroup" className="divide-y divide-vault-100">
                {folders.map((folder) => (
                  <FolderRow
                    key={folder.id}
                    folder={folder}
                    roomId={roomId}
                    canManage={canManage}
                    active={activeId === folder.id}
                    onSelect={() => setActiveId(folder.id)}
                    actions={{
                      onRename: setRenameFolderTarget,
                      onShare: (item) =>
                        setShareTarget({
                          resourceType: 'FOLDER',
                          resourceId: item.id,
                          resourceName: item.name,
                        }),
                      onDelete: setDeleteFolderTarget,
                      onDropFile: (fileId, destination) => {
                        const file = files.find((candidate) => candidate.id === fileId);
                        void handleMove(fileId, destination.id, file?.name ?? 'File');
                      },
                    }}
                  />
                ))}

                {files.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    canManage={canManage}
                    active={activeId === file.id}
                    onSelect={() => setActiveId(file.id)}
                    actions={{
                      onOpen: openFile,
                      onRename: setRenameFileTarget,
                      onMove: setMoveTarget,
                      onShare: (item) =>
                        setShareTarget({
                          resourceType: 'FILE',
                          resourceId: item.id,
                          resourceName: item.name,
                        }),
                      onDownload: (item) => void handleDownload(item),
                      onDelete: setDeleteFileTarget,
                    }}
                  />
                ))}
              </div>
            )}

            {!isEmpty ? (
              <ListFooter
                folderCount={folders.length}
                fileCount={files.length}
                hasMore={Boolean(cursor)}
                loadingMore={loadingMore || isFetching}
                canManage={canManage}
                onLoadMore={() => void loadMore()}
              />
            ) : null}
          </div>
        </div>

        {detailsOpen && details ? (
          <div className="hidden xl:block">
            <DetailsPanel
              target={details}
              ownerName={room.owner.name}
              breadcrumb={contents.breadcrumb}
              canManage={canManage}
              onClose={() => setDetailsOpen(false)}
              onShare={() =>
                setShareTarget(
                  details.kind === 'folder'
                    ? {
                        resourceType: 'FOLDER',
                        resourceId: details.folder.id,
                        resourceName: details.folder.name,
                      }
                    : {
                        resourceType: 'FILE',
                        resourceId: details.file.id,
                        resourceName: details.file.name,
                      },
                )
              }
            />
          </div>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={`application/pdf,${ACCEPTED_EXTENSION}`}
        multiple
        hidden
        onChange={(event) => {
          handleUploadFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />

      <DropOverlay
        enabled={canManage}
        destination={contents.folder.name}
        onFiles={handleUploadFiles}
      />

      <SearchPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        roomId={roomId}
        onOpenFolder={(id) => navigate(`/rooms/${roomId}/f/${id}`)}
        onOpenFile={(id) => navigate(`/rooms/${roomId}/file/${id}`)}
      />

      <RenameDialog
        open={Boolean(renameFolderTarget)}
        onOpenChange={(open) => !open && setRenameFolderTarget(null)}
        title="Rename folder"
        initialName={renameFolderTarget?.name ?? ''}
        takenNames={takenFolderNames}
        loading={renamingFolder}
        onSubmit={async (name) => {
          if (!renameFolderTarget) return;
          const updated = await renameFolder({ id: renameFolderTarget.id, body: { name } }).unwrap();
          setRenameFolderTarget(null);
          toast.success(updated.name === name ? 'Folder renamed' : `Saved as "${updated.name}"`);
        }}
      />

      <RenameDialog
        open={Boolean(renameFileTarget)}
        onOpenChange={(open) => !open && setRenameFileTarget(null)}
        title="Rename file"
        initialName={renameFileTarget?.name ?? ''}
        takenNames={files.map((file) => file.name)}
        loading={renamingFile}
        onSubmit={async (name) => {
          if (!renameFileTarget) return;
          const updated = await renameFile({ id: renameFileTarget.id, body: { name } }).unwrap();
          setRenameFileTarget(null);
          toast.success(
            updated.name === name ? 'File renamed' : `Saved as "${updated.name}"`,
            {
              description:
                updated.name === name
                  ? undefined
                  : 'Another file here already used that name, so a number was appended.',
            },
          );
        }}
      />

      {deleteFolderTarget ? (
        <DeleteFolderDialog
          folderId={deleteFolderTarget.id}
          folderName={deleteFolderTarget.name}
          loading={deletingFolder}
          onOpenChange={(open) => !open && setDeleteFolderTarget(null)}
          onConfirm={async () => {
            try {
              await deleteFolder(deleteFolderTarget.id).unwrap();
              toast.success(`"${deleteFolderTarget.name}" deleted`);
              setDeleteFolderTarget(null);
              if (routeFolderId === deleteFolderTarget.id) navigate(`/rooms/${roomId}`);
            } catch (caught) {
              toast.error(getErrorMessage(caught, 'Unable to delete the folder'));
            }
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteFileTarget)}
        onOpenChange={(open) => !open && setDeleteFileTarget(null)}
        title={`Delete "${deleteFileTarget?.name}"?`}
        icon={
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl text-red-600">
            <PiWarningOctagonFill />
          </span>
        }
        description="This removes the document permanently. Anyone it was shared with loses access immediately."
        confirmLabel="Delete file"
        loading={deletingFile}
        onConfirm={async () => {
          if (!deleteFileTarget) return;
          try {
            await deleteFile(deleteFileTarget.id).unwrap();
            toast.success(`"${deleteFileTarget.name}" deleted`);
            setDeleteFileTarget(null);
            setActiveId(null);
          } catch (caught) {
            toast.error(getErrorMessage(caught, 'Unable to delete the file'));
          }
        }}
      />

      {moveTarget ? (
        <MoveDialog
          open
          onOpenChange={(open) => !open && setMoveTarget(null)}
          roomId={roomId}
          rootFolderId={room.rootFolderId}
          roomName={room.name}
          fileName={moveTarget.name}
          currentFolderId={contents.folder.id}
          loading={movingFile}
          onMove={(destination) => void handleMove(moveTarget.id, destination, moveTarget.name)}
        />
      ) : null}

      {shareTarget ? (
        <ShareDialog
          open
          onOpenChange={(open) => !open && setShareTarget(null)}
          resourceType={shareTarget.resourceType}
          resourceId={shareTarget.resourceId}
          resourceName={shareTarget.resourceName}
        />
      ) : null}
    </div>
  );
}
