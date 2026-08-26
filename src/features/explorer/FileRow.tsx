import { useState } from 'react';
import {
  PiArrowsOutCardinalBold,
  PiDotsThreeVerticalBold,
  PiDownloadSimpleBold,
  PiEyeBold,
  PiFilePdfFill,
  PiPencilSimpleBold,
  PiShareNetworkBold,
  PiTrashBold,
} from 'react-icons/pi';
import type { FileDto } from '@/api/data-room-api-ts/types';
import { IconButton } from '@/components/ui/Button';
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu';
import { Tooltip } from '@/components/ui/Tooltip';
import { formatBytes, formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';

export type FileRowActions = {
  onOpen: (file: FileDto) => void;
  onRename: (file: FileDto) => void;
  onMove: (file: FileDto) => void;
  onShare: (file: FileDto) => void;
  onDownload: (file: FileDto) => void;
  onDelete: (file: FileDto) => void;
};

export function FileRow({
  file,
  canManage,
  active,
  duplicateOf,
  onSelect,
  actions,
}: {
  file: FileDto;
  canManage: boolean;
  active: boolean;
  /** Set when another row in this folder shares the base name — Vault 11. */
  duplicateOf?: string;
  onSelect: () => void;
  actions: FileRowActions;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      role="row"
      onPointerDown={onSelect}
      onFocusCapture={onSelect}
      tabIndex={-1}
      data-row-id={file.id}
      draggable={canManage}
      onDragStart={(event) => {
        event.dataTransfer.setData('application/x-data-room-file', file.id);
        event.dataTransfer.effectAllowed = 'move';
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      onDoubleClick={() => actions.onOpen(file)}
      className={cn(
        'group grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-3 transition-colors sm:grid-cols-[1fr_5rem_9rem_auto] lg:grid-cols-[1fr_7rem_5rem_9rem_auto]',
        active ? 'bg-accent-soft/60' : 'hover:bg-vault-50',
        dragging && 'opacity-40',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600">
          <PiFilePdfFill className="text-lg" />
        </span>
        <div className="min-w-0">
          <Tooltip label={file.name}>
            <button
              type="button"
              onClick={() => actions.onOpen(file)}
              className="block max-w-full truncate text-left text-[13px] font-semibold text-vault-900 hover:text-accent-strong"
            >
              {file.name}
            </button>
          </Tooltip>
          <p className="tabular mt-0.5 truncate text-[11px] text-vault-500 sm:hidden">
            PDF · {formatBytes(file.size)} · {formatRelative(file.updatedAt)}
          </p>
          {duplicateOf ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-700 uppercase">
              Renamed copy of {duplicateOf}
            </span>
          ) : null}
        </div>
      </div>

      <div className="hidden text-[12px] text-vault-500 lg:block">PDF document</div>
      <div className="tabular hidden text-[12px] text-vault-500 sm:block">{formatBytes(file.size)}</div>
      <div className="hidden truncate text-[12px] text-vault-500 sm:block">
        {formatRelative(file.updatedAt)}
      </div>

      <div className="flex justify-end opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
        <Menu
          trigger={
            <IconButton label={`Actions for ${file.name}`}>
              <PiDotsThreeVerticalBold />
            </IconButton>
          }
        >
          <MenuItem icon={<PiEyeBold />} onSelect={() => actions.onOpen(file)}>
            Preview
          </MenuItem>
          <MenuItem icon={<PiDownloadSimpleBold />} onSelect={() => actions.onDownload(file)}>
            Download
          </MenuItem>
          {canManage ? (
            <>
              <MenuSeparator />
              <MenuItem icon={<PiPencilSimpleBold />} onSelect={() => actions.onRename(file)}>
                Rename
              </MenuItem>
              <MenuItem icon={<PiArrowsOutCardinalBold />} onSelect={() => actions.onMove(file)}>
                Move to…
              </MenuItem>
              <MenuItem icon={<PiShareNetworkBold />} onSelect={() => actions.onShare(file)}>
                Share
              </MenuItem>
              <MenuSeparator />
              <MenuItem icon={<PiTrashBold />} tone="danger" onSelect={() => actions.onDelete(file)}>
                Delete
              </MenuItem>
            </>
          ) : null}
        </Menu>
      </div>
    </div>
  );
}
