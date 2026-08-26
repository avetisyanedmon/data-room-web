import { PiWarningOctagonFill } from 'react-icons/pi';
import { useDeleteFolderPreviewQuery } from '@/api/data-room-api-ts/dataRoomApi';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatBytes } from '@/lib/format';

const TYPE_TO_CONFIRM_THRESHOLD = 25;

/** Warns with the real subtree — Vault 01 / 12, backed by /delete-preview. */
export function DeleteFolderDialog({
  folderId,
  folderName,
  loading,
  onOpenChange,
  onConfirm,
}: {
  folderId: string;
  folderName: string;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const { data: preview, isLoading } = useDeleteFolderPreviewQuery(folderId);

  const total = (preview?.fileCount ?? 0) + (preview?.folderCount ?? 0);

  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title={`Delete "${folderName}"?`}
      icon={
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-xl text-red-600">
          <PiWarningOctagonFill />
        </span>
      }
      description="Everything inside this folder is removed permanently, including anything shared from it."
      confirmLabel="Delete folder"
      confirmPhrase={total >= TYPE_TO_CONFIRM_THRESHOLD ? folderName : undefined}
      loading={loading}
      onConfirm={onConfirm}
      body={
        isLoading ? (
          <div className="space-y-2 rounded-xl border border-vault-100 p-4">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ) : preview ? (
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
            <p className="text-[13px] leading-relaxed text-red-800">
              This permanently deletes{' '}
              <strong>
                {preview.fileCount} {preview.fileCount === 1 ? 'file' : 'files'}
              </strong>
              ,{' '}
              <strong>
                {preview.folderCount} {preview.folderCount === 1 ? 'subfolder' : 'subfolders'}
              </strong>{' '}
              and <strong>{formatBytes(preview.totalSize)}</strong> of documents. This cannot be undone.
            </p>
            {preview.sampleNames.length > 0 ? (
              <p className="mt-3 border-t border-red-100 pt-3 text-[11px] break-words text-red-700/80">
                Includes: {preview.sampleNames.join(', ')}
                {total > preview.sampleNames.length ? ' …' : ''}
              </p>
            ) : null}
          </div>
        ) : null
      }
    />
  );
}
