import { PiFilePdfFill, PiFolderFill, PiShareNetworkBold, PiXBold } from 'react-icons/pi';
import type { BreadcrumbDto, FileDto, FolderDto } from '@/api/data-room-api-ts/types';
import { useGetSharesQuery } from '@/api/share-api-ts/shareApi';
import { Avatar } from '@/components/layout/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { formatBytes, formatCount, formatDate } from '@/lib/format';

export type DetailsTarget =
  | { kind: 'folder'; folder: FolderDto }
  | { kind: 'file'; file: FileDto }
  | null;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-[12px] text-vault-500">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[12px] font-medium text-vault-900">{value}</dd>
    </div>
  );
}

/**
 * Vault 01's right-hand panel, minus the Activity timeline — there is no audit
 * model behind it. Owner, dates, location and Shared-with are all real fields.
 */
export function DetailsPanel({
  target,
  ownerName,
  breadcrumb,
  canManage,
  onClose,
  onShare,
}: {
  target: DetailsTarget;
  ownerName: string;
  breadcrumb: BreadcrumbDto[];
  canManage: boolean;
  onClose: () => void;
  onShare: () => void;
}) {
  const resourceType = target?.kind === 'folder' ? 'FOLDER' : 'FILE';
  const resourceId = target?.kind === 'folder' ? target.folder.id : target?.file.id;

  const { data: shares = [] } = useGetSharesQuery(
    { resourceType, resourceId: resourceId ?? '' },
    { skip: !resourceId || !canManage },
  );

  if (!target) return null;

  const isFolder = target.kind === 'folder';
  const item = isFolder ? target.folder : target.file;
  const location = breadcrumb.map((crumb) => crumb.name).join(' / ');
  const activeShares = shares.filter((share) => share.kind === 'USER');
  const publicShare = shares.find((share) => share.kind === 'PUBLIC_LINK');

  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-l border-vault-100 bg-white">
      <div className="flex items-center justify-between border-b border-vault-100 px-5 py-4">
        <h2 className="text-[13px] font-semibold text-vault-900">Details</h2>
        <IconButton label="Close details panel" onClick={onClose}>
          <PiXBold className="text-xs" />
        </IconButton>
      </div>

      <div className="px-5 py-5">
        <div className="flex flex-col items-center text-center">
          <span
            className={`mb-3 flex size-14 items-center justify-center rounded-xl text-2xl ${
              isFolder ? 'bg-vault-900 text-white' : 'border border-red-100 bg-red-50 text-red-600'
            }`}
          >
            {isFolder ? <PiFolderFill /> : <PiFilePdfFill />}
          </span>
          <h3 className="w-full text-[15px] font-semibold break-words text-vault-900">{item.name}</h3>
          <p className="mt-0.5 text-[12px] text-vault-500">
            {isFolder
              ? `Folder · ${formatCount(target.folder.itemCount, 'item')}`
              : `PDF · ${formatBytes(target.file.size)}`}
          </p>
        </div>

        <dl className="mt-6 space-y-3 border-t border-vault-100 pt-5">
          <Field label="Owner" value={ownerName} />
          <Field label="Created" value={formatDate(item.createdAt)} />
          <Field label="Modified" value={formatDate(item.updatedAt)} />
          <Field label="Location" value={location || '—'} />
          {isFolder ? <Field label="Total size" value={formatBytes(target.folder.totalSize)} /> : null}
        </dl>

        {canManage ? (
          <div className="mt-6 border-t border-vault-100 pt-5">
            <p className="mb-3 text-[11px] font-semibold tracking-wider text-vault-500 uppercase">
              Shared with
            </p>
            {activeShares.length === 0 && !publicShare ? (
              <p className="text-[12px] text-vault-400">Not shared with anyone yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {activeShares.map((share) => (
                  <li key={share.id} className="flex items-center gap-2.5">
                    <Avatar size="sm" name={share.recipient?.name ?? share.recipientEmail ?? '?'} />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-vault-700">
                      {share.recipient?.email ?? share.recipientEmail}
                    </span>
                    <Chip tone="neutral">Viewer</Chip>
                  </li>
                ))}
                {publicShare ? (
                  <li className="flex items-center gap-2.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-amber-100 text-[11px] text-amber-700">
                      <PiShareNetworkBold />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-vault-700">
                      Anyone with the link
                    </span>
                    <Chip tone="warning">Public</Chip>
                  </li>
                ) : null}
              </ul>
            )}
            <Button
              size="sm"
              variant="secondary"
              className="mt-4 w-full"
              icon={<PiShareNetworkBold />}
              onClick={onShare}
            >
              Manage sharing
            </Button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
