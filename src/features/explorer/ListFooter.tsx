import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { PiLockSimpleFill } from 'react-icons/pi';

/**
 * Cursor pagination, honestly labelled — the API cannot address "page 17",
 * so the mockups' numbered pager becomes a running count plus Load more.
 */
export function ListFooter({
  folderCount,
  fileCount,
  hasMore,
  loadingMore,
  canManage,
  onLoadMore,
}: {
  folderCount: number;
  fileCount: number;
  hasMore: boolean;
  loadingMore: boolean;
  canManage: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-vault-100 bg-vault-50/40 px-5 py-3">
      <p className="tabular text-[12px] text-vault-500">
        Showing {folderCount} {folderCount === 1 ? 'folder' : 'folders'} and {fileCount}{' '}
        {fileCount === 1 ? 'file' : 'files'}
        {hasMore ? ' so far' : ''}
      </p>
      <div className="flex items-center gap-3">
        {!canManage ? (
          <Chip tone="warning" icon={<PiLockSimpleFill />}>
            View-only access
          </Chip>
        ) : null}
        {hasMore ? (
          <Button size="sm" variant="secondary" loading={loadingMore} onClick={onLoadMore}>
            Load more files
          </Button>
        ) : null}
      </div>
    </div>
  );
}
