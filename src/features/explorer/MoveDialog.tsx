import { useState } from 'react';
import { PiCaretDownBold, PiCaretRightBold, PiFolderFill, PiFolderOpenFill } from 'react-icons/pi';
import { useGetContentsQuery } from '@/api/data-room-api-ts/dataRoomApi';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogClose } from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

/**
 * Folder picker — Vault 12. Children load lazily as branches open, so a room
 * with thousands of folders costs one request per expanded node.
 */
function TreeNode({
  roomId,
  folderId,
  name,
  depth,
  selectedId,
  currentFolderId,
  onSelect,
  defaultOpen = false,
}: {
  roomId: string;
  folderId: string;
  name: string;
  depth: number;
  selectedId: string;
  currentFolderId: string;
  onSelect: (id: string, name: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { data, isFetching } = useGetContentsQuery({ roomId, folderId }, { skip: !open });

  const children = data?.folders ?? [];
  const isSelected = selectedId === folderId;
  const isCurrent = currentFolderId === folderId;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-lg pr-2 transition-colors',
          isSelected ? 'bg-accent-soft' : 'hover:bg-vault-50',
        )}
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        <button
          type="button"
          aria-label={open ? `Collapse ${name}` : `Expand ${name}`}
          onClick={() => setOpen((value) => !value)}
          className="flex size-6 shrink-0 items-center justify-center rounded text-vault-400 hover:text-vault-900"
        >
          {isFetching && open ? (
            <Spinner className="size-3" />
          ) : open ? (
            <PiCaretDownBold className="text-[10px]" />
          ) : (
            <PiCaretRightBold className="text-[10px]" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onSelect(folderId, name)}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
        >
          {open ? (
            <PiFolderOpenFill className={cn('shrink-0', isSelected ? 'text-accent' : 'text-vault-400')} />
          ) : (
            <PiFolderFill className={cn('shrink-0', isSelected ? 'text-accent' : 'text-vault-400')} />
          )}
          <span
            className={cn(
              'truncate text-[13px]',
              isSelected ? 'font-semibold text-accent-strong' : 'text-vault-700',
            )}
          >
            {name}
          </span>
          {isCurrent ? (
            <span className="ml-auto shrink-0 text-[10px] font-bold tracking-wide text-vault-400 uppercase">
              Current
            </span>
          ) : null}
        </button>
      </div>

      {open
        ? children.map((child) => (
            <TreeNode
              key={child.id}
              roomId={roomId}
              folderId={child.id}
              name={child.name}
              depth={depth + 1}
              selectedId={selectedId}
              currentFolderId={currentFolderId}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
}

export function MoveDialog({
  open,
  onOpenChange,
  roomId,
  rootFolderId,
  roomName,
  fileName,
  currentFolderId,
  loading,
  onMove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  rootFolderId: string;
  roomName: string;
  fileName: string;
  currentFolderId: string;
  loading: boolean;
  onMove: (folderId: string) => void;
}) {
  const [selected, setSelected] = useState<{ id: string; name: string }>({
    id: rootFolderId,
    name: roomName,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Move "${fileName}"`}
      description="Choose a destination folder in this data room."
      footer={
        <>
          <span className="mr-auto min-w-0 truncate text-[11px] text-vault-500">
            Destination: <strong className="text-vault-900">{selected.name}</strong>
          </span>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button
            loading={loading}
            disabled={selected.id === currentFolderId}
            onClick={() => onMove(selected.id)}
          >
            {selected.id === currentFolderId ? 'Already here' : 'Move here'}
          </Button>
        </>
      }
    >
      <div className="max-h-80 overflow-y-auto rounded-xl border border-vault-100 p-1.5">
        <TreeNode
          roomId={roomId}
          folderId={rootFolderId}
          name={roomName}
          depth={0}
          defaultOpen
          selectedId={selected.id}
          currentFolderId={currentFolderId}
          onSelect={(id, name) => setSelected({ id, name })}
        />
      </div>
    </Dialog>
  );
}
