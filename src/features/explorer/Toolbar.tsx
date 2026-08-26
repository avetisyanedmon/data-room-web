import {
  PiCloudArrowUpFill,
  PiFolderPlusBold,
  PiInfoBold,
  PiMagnifyingGlassBold,
} from 'react-icons/pi';
import type { BreadcrumbDto } from '@/api/data-room-api-ts/types';
import { Button, IconButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Breadcrumbs } from './Breadcrumbs';

export function Toolbar({
  roomId,
  roomName,
  breadcrumb,
  canManage,
  detailsOpen,
  onNewFolder,
  onUpload,
  onSearch,
  onToggleDetails,
}: {
  roomId: string;
  roomName: string;
  breadcrumb: BreadcrumbDto[];
  canManage: boolean;
  detailsOpen: boolean;
  onNewFolder: () => void;
  onUpload: () => void;
  onSearch: () => void;
  onToggleDetails: () => void;
}) {
  return (
    <header className="shrink-0 border-b border-vault-100 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Breadcrumbs roomId={roomId} items={breadcrumb} roomName={roomName} />

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<PiMagnifyingGlassBold />}
            onClick={onSearch}
            className="font-normal text-vault-500"
          >
            Search this room
            <kbd className="ml-2 hidden rounded border border-vault-200 bg-vault-50 px-1.5 py-0.5 text-[10px] font-semibold text-vault-400 sm:inline">
              ⌘K
            </kbd>
          </Button>

          {canManage ? (
            <>
              <Button variant="secondary" size="sm" icon={<PiFolderPlusBold />} onClick={onNewFolder}>
                <span className="hidden sm:inline">New folder</span>
              </Button>
              <Button size="sm" icon={<PiCloudArrowUpFill />} onClick={onUpload}>
                Upload
              </Button>
            </>
          ) : (
            <Chip tone="warning">Read-only access</Chip>
          )}

          <IconButton
            label={detailsOpen ? 'Hide details panel' : 'Show details panel'}
            variant={detailsOpen ? 'secondary' : 'ghost'}
            className="hidden xl:inline-flex"
            onClick={onToggleDetails}
          >
            <PiInfoBold />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
