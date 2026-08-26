import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PiDotsThreeVerticalBold,
  PiFolderFill,
  PiPencilSimpleBold,
  PiShareNetworkBold,
  PiTrashBold,
} from 'react-icons/pi';
import type { FolderDto } from '@/api/data-room-api-ts/types';
import { IconButton } from '@/components/ui/Button';
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu';
import { Tooltip } from '@/components/ui/Tooltip';
import { formatBytes, formatCount, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';

export type FolderRowActions = {
  onRename: (folder: FolderDto) => void;
  onShare: (folder: FolderDto) => void;
  onDelete: (folder: FolderDto) => void;
  onDropFile: (fileId: string, folder: FolderDto) => void;
};

export function FolderRow({
  folder,
  roomId,
  canManage,
  active,
  onSelect,
  actions,
}: {
  folder: FolderDto;
  roomId: string;
  canManage: boolean;
  active: boolean;
  onSelect: () => void;
  actions: FolderRowActions;
}) {
  const [dropTarget, setDropTarget] = useState(false);

  return (
    <div
      role="row"
      onPointerDown={onSelect}
      onFocusCapture={onSelect}
      data-row-id={folder.id}
      onDragOver={(event) => {
        if (!canManage) return;
        if (!event.dataTransfer.types.includes('application/x-data-room-file')) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        setDropTarget(true);
      }}
      onDragLeave={() => setDropTarget(false)}
      onDrop={(event) => {
        setDropTarget(false);
        const fileId = event.dataTransfer.getData('application/x-data-room-file');
        if (!fileId) return;
        event.preventDefault();
        actions.onDropFile(fileId, folder);
      }}
      className={cn(
        'group grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3 transition-colors sm:grid-cols-[1fr_5rem_9rem_auto] lg:grid-cols-[1fr_7rem_5rem_9rem_auto]',
        active ? 'bg-accent-soft/60' : 'hover:bg-vault-50',
        dropTarget && 'bg-accent-soft ring-2 ring-accent ring-inset',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-vault-900 text-white">
          <PiFolderFill className="text-lg" />
        </span>
        <div className="min-w-0">
          <Tooltip label={folder.name}>
            <Link
              to={`/rooms/${roomId}/f/${folder.id}`}
              className="block max-w-full truncate text-[13px] font-semibold text-vault-900 hover:text-accent-strong"
            >
              {folder.name}
            </Link>
          </Tooltip>
          <p className="tabular mt-0.5 truncate text-[11px] text-vault-500 sm:hidden">
            Folder · {formatCount(folder.itemCount, 'item')}
          </p>
        </div>
      </div>

      <div className="hidden text-[12px] text-vault-500 lg:block">Folder</div>
      <div className="tabular hidden text-[12px] text-vault-500 sm:block">
        {formatBytes(folder.totalSize)}
      </div>
      <div className="hidden truncate text-[12px] text-vault-500 sm:block">
        {formatRelative(folder.updatedAt)}
      </div>

      <div className="flex justify-end opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
        {canManage ? (
          <Menu
            trigger={
              <IconButton label={`Actions for ${folder.name}`}>
                <PiDotsThreeVerticalBold />
              </IconButton>
            }
          >
            <MenuItem icon={<PiPencilSimpleBold />} onSelect={() => actions.onRename(folder)}>
              Rename
            </MenuItem>
            <MenuItem icon={<PiShareNetworkBold />} onSelect={() => actions.onShare(folder)}>
              Share
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<PiTrashBold />} tone="danger" onSelect={() => actions.onDelete(folder)}>
              Delete folder
            </MenuItem>
          </Menu>
        ) : null}
      </div>
    </div>
  );
}
