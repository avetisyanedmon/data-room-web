import { Link, useNavigate } from 'react-router-dom';
import { PiCaretRightBold, PiDotsThreeBold, PiHouseFill } from 'react-icons/pi';
import type { BreadcrumbDto } from '@/api/data-room-api-ts/types';
import { Menu, MenuItem, MenuLabel } from '@/components/ui/Menu';
import { IconButton } from '@/components/ui/Button';

const VISIBLE_TAIL = 2;

/**
 * Collapses the middle of a deep path into a menu — Axiom 03. The first
 * breadcrumb entry is the room root, which is rendered as a home icon.
 */
export function Breadcrumbs({
  roomId,
  items,
  roomName,
}: {
  roomId: string;
  items: BreadcrumbDto[];
  roomName: string;
}) {
  const navigate = useNavigate();
  const [root, ...rest] = items;
  const collapsed = rest.length > VISIBLE_TAIL + 1;
  const hidden = collapsed ? rest.slice(0, rest.length - VISIBLE_TAIL) : [];
  const shown = collapsed ? rest.slice(rest.length - VISIBLE_TAIL) : rest;

  const href = (id: string) => (id === root?.id ? `/rooms/${roomId}` : `/rooms/${roomId}/f/${id}`);

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
      <Link
        to={`/rooms/${roomId}`}
        title={roomName}
        className="flex shrink-0 items-center gap-1.5 text-vault-500 transition-colors hover:text-vault-900"
      >
        <PiHouseFill className="text-[13px]" />
        <span className="max-w-[10rem] truncate font-medium">{roomName}</span>
      </Link>

      {collapsed ? (
        <>
          <PiCaretRightBold className="shrink-0 text-[9px] text-vault-300" />
          <Menu
            align="start"
            trigger={
              <IconButton label="Show hidden folders" className="size-6">
                <PiDotsThreeBold />
              </IconButton>
            }
          >
            <MenuLabel>Skipped folders</MenuLabel>
            {hidden.map((item) => (
              <MenuItem key={item.id} onSelect={() => navigate(href(item.id))}>
                <span className="truncate">{item.name}</span>
              </MenuItem>
            ))}
          </Menu>
        </>
      ) : null}

      {shown.map((item, index) => {
        const isLast = index === shown.length - 1;
        return (
          <span key={item.id} className="flex min-w-0 items-center gap-1.5">
            <PiCaretRightBold className="shrink-0 text-[9px] text-vault-300" />
            {isLast ? (
              <span
                aria-current="page"
                title={item.name}
                className="max-w-[16rem] truncate font-semibold text-vault-900"
              >
                {item.name}
              </span>
            ) : (
              <Link
                to={href(item.id)}
                title={item.name}
                className="max-w-[10rem] truncate text-vault-500 transition-colors hover:text-vault-900"
              >
                {item.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
