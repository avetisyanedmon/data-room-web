import { Link } from 'react-router-dom';
import {
  PiDotsThreeVerticalBold,
  PiFolderSimpleFill,
  PiPencilSimpleBold,
  PiShareNetworkBold,
  PiTrashBold,
} from 'react-icons/pi';
import type { DataRoomDto } from '@/api/data-room-api-ts/types';
import { IconButton } from '@/components/ui/Button';
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu';
import { formatBytes, formatCount, formatRelative } from '@/lib/format';

export function RoomCard({
  room,
  onRename,
  onDelete,
  onShare,
}: {
  room: DataRoomDto;
  onRename: (room: DataRoomDto) => void;
  onDelete: (room: DataRoomDto) => void;
  onShare: (room: DataRoomDto) => void;
}) {
  return (
    <div className="group relative rounded-xl border border-vault-100 bg-white p-5 transition-colors hover:border-vault-200 hover:shadow-[var(--shadow-panel)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-vault-900 text-white">
          <PiFolderSimpleFill className="text-lg" />
        </span>
        <div className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
          <Menu
            trigger={
              <IconButton label={`Actions for ${room.name}`}>
                <PiDotsThreeVerticalBold />
              </IconButton>
            }
          >
            <MenuItem icon={<PiPencilSimpleBold />} onSelect={() => onRename(room)}>
              Rename
            </MenuItem>
            <MenuItem icon={<PiShareNetworkBold />} onSelect={() => onShare(room)}>
              Share
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<PiTrashBold />} tone="danger" onSelect={() => onDelete(room)}>
              Delete data room
            </MenuItem>
          </Menu>
        </div>
      </div>

      <Link to={`/rooms/${room.id}`} className="mt-4 block focus-visible:outline-none">
        <span className="absolute inset-0 rounded-xl" aria-hidden />
        <h3 className="truncate text-[15px] font-semibold text-vault-900" title={room.name}>
          {room.name}
        </h3>
        <p className="tabular mt-1 text-[12px] text-vault-500">
          {formatCount(room.itemCount, 'item')} · {formatBytes(room.totalSize)}
        </p>
        <p className="mt-3 text-[11px] text-vault-400">Updated {formatRelative(room.updatedAt)}</p>
      </Link>
    </div>
  );
}
