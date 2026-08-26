import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  PiFilePdfFill,
  PiFolderSimpleFill,
  PiPlusBold,
  PiUsersThreeFill,
  PiWarningOctagonFill,
} from 'react-icons/pi';
import {
  useDeleteDataRoomMutation,
  useGetDataRoomsQuery,
  useRenameDataRoomMutation,
} from '@/api/data-room-api-ts/dataRoomApi';
import type { DataRoomDto, SharedEntryDto } from '@/api/data-room-api-ts/types';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatBytes } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';
import { RenameDialog } from '@/features/explorer/RenameDialog';
import { ShareDialog } from '@/features/sharing/ShareDialog';
import { CreateRoomDialog } from './CreateRoomDialog';
import { RoomCard } from './RoomCard';

/** A share can point at a room, a folder or a single file — land the user on it. */
function sharedHref(entry: SharedEntryDto): string {
  if (entry.resourceType === 'FOLDER' && entry.folder) {
    return `/rooms/${entry.folder.dataRoomId}/f/${entry.folder.id}`;
  }
  if (entry.resourceType === 'FILE' && entry.file) {
    return `/rooms/${entry.file.dataRoomId}/file/${entry.file.id}`;
  }
  return `/rooms/${entry.dataRoom.id}`;
}

function sharedLabel(entry: SharedEntryDto) {
  if (entry.resourceType === 'FOLDER') return `Folder · ${entry.folder?.name ?? 'Shared folder'}`;
  if (entry.resourceType === 'FILE') return `File · ${entry.file?.name ?? 'Shared file'}`;
  return 'Entire data room';
}

export function RoomListPage() {
  const { data, isLoading, isError, refetch } = useGetDataRoomsQuery();
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DataRoomDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DataRoomDto | null>(null);
  const [shareTarget, setShareTarget] = useState<DataRoomDto | null>(null);

  const [renameRoom, { isLoading: renaming }] = useRenameDataRoomMutation();
  const [deleteRoom, { isLoading: deleting }] = useDeleteDataRoomMutation();

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRoom(deleteTarget.id).unwrap();
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete the data room'));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-vault-900">Data rooms</h1>
            <p className="mt-1 text-[13px] text-vault-500">
              Organise, review and share due diligence documents.
            </p>
          </div>
          <Button icon={<PiPlusBold />} onClick={() => setCreateOpen(true)}>
            New data room
          </Button>
        </header>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="rounded-xl border border-vault-100 bg-white p-5">
                <Skeleton className="size-10 rounded-lg" />
                <Skeleton className="mt-4 h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/3" />
                <Skeleton className="mt-4 h-2.5 w-1/4" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={<PiWarningOctagonFill />}
            title="We couldn't load your data rooms"
            description="The server didn't respond. Check your connection and try again."
            actions={<Button onClick={() => void refetch()}>Try again</Button>}
          />
        ) : !data?.owned.length && !data?.shared.length ? (
          <EmptyState
            icon={<PiFolderSimpleFill />}
            title="No data rooms yet"
            description="Create your first room to start uploading documents and granting read-only access."
            actions={
              <Button icon={<PiPlusBold />} onClick={() => setCreateOpen(true)}>
                Create data room
              </Button>
            }
          />
        ) : (
          <div className="space-y-10">
            {data.owned.length > 0 ? (
              <section>
                <h2 className="mb-3 text-[11px] font-bold tracking-widest text-vault-500 uppercase">
                  Owned by you
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.owned.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onRename={setRenameTarget}
                      onDelete={setDeleteTarget}
                      onShare={setShareTarget}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {data.shared.length > 0 ? (
              <section>
                <h2 className="mb-3 text-[11px] font-bold tracking-widest text-vault-500 uppercase">
                  Shared with you
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.shared.map((entry) => (
                    <Link
                      key={entry.shareId}
                      to={sharedHref(entry)}
                      className="rounded-xl border border-vault-100 bg-white p-5 transition-colors hover:border-vault-200 hover:shadow-[var(--shadow-panel)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                          {entry.resourceType === 'FILE' ? (
                            <PiFilePdfFill className="text-lg" />
                          ) : entry.resourceType === 'FOLDER' ? (
                            <PiFolderSimpleFill className="text-lg" />
                          ) : (
                            <PiUsersThreeFill className="text-lg" />
                          )}
                        </span>
                        <Chip tone="warning">Read-only</Chip>
                      </div>
                      <h3 className="mt-4 truncate text-[15px] font-semibold text-vault-900">
                        {entry.dataRoom.name}
                      </h3>
                      <p className="mt-1 truncate text-[12px] text-vault-500">{sharedLabel(entry)}</p>
                      <p className="mt-3 truncate text-[11px] text-vault-400">
                        Shared by {entry.dataRoom.owner.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>

      <CreateRoomDialog open={createOpen} onOpenChange={setCreateOpen} />

      <RenameDialog
        open={Boolean(renameTarget)}
        title="Rename data room"
        initialName={renameTarget?.name ?? ''}
        loading={renaming}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        onSubmit={async (name) => {
          if (!renameTarget) return;
          const updated = await renameRoom({ id: renameTarget.id, body: { name } }).unwrap();
          toast.success(`Renamed to "${updated.name}"`);
          setRenameTarget(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        icon={
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl text-red-600">
            <PiWarningOctagonFill />
          </span>
        }
        description="Everything inside this data room is removed permanently, and anyone it was shared with loses access immediately."
        body={
          deleteTarget ? (
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-[13px] text-red-800">
              This deletes <strong>{deleteTarget.itemCount.toLocaleString()} items</strong> and{' '}
              <strong>{formatBytes(deleteTarget.totalSize)}</strong> of documents. This action cannot be
              undone.
            </div>
          ) : null
        }
        confirmLabel="Delete data room"
        confirmPhrase={deleteTarget && deleteTarget.itemCount > 0 ? deleteTarget.name : undefined}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />

      {shareTarget ? (
        <ShareDialog
          open
          onOpenChange={(open) => !open && setShareTarget(null)}
          resourceType="DATA_ROOM"
          resourceId={shareTarget.id}
          resourceName={shareTarget.name}
        />
      ) : null}
    </div>
  );
}

