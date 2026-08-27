import { Link, useNavigate } from 'react-router-dom';
import { PiCaretRightBold, PiDotsThreeBold, PiHouseFill } from 'react-icons/pi';
import type { BreadcrumbDto } from '@/api/data-room-api-ts/types';
import { Menu, MenuItem, MenuLabel } from '@/components/ui/Menu';
import { IconButton } from '@/components/ui/Button';
import { collapseTrail } from '@/lib/breadcrumb-trail';

/**
 * Collapses the middle of a deep path into a menu — Axiom 03.
 *
 * The first entry is the room root only for someone who can reach it. A share
 * recipient's trail is trimmed server-side to the folder they were granted, so
 * the lead crumb is that folder: it keeps its own name, and the home shortcut
 * to the room is withheld, because opening the room root would be a 403.
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
  const { lead, hidden, shown, collapsed } = collapseTrail(items);

  const href = (item: BreadcrumbDto) =>
    item.parentId === null ? `/rooms/${roomId}` : `/rooms/${roomId}/f/${item.id}`;

  // An absent lead means an empty trail, which only happens at the room root.
  const leadNode =
    !lead || lead.parentId === null ? (
      <Link
        to={`/rooms/${roomId}`}
        title={roomName}
        className="flex shrink-0 items-center gap-1.5 text-vault-500 transition-colors hover:text-vault-900"
      >
        <PiHouseFill className="text-[13px]" />
        <span className="max-w-[10rem] truncate font-medium">{roomName}</span>
      </Link>
    ) : shown.length === 0 ? (
      <span
        aria-current="page"
        title={lead.name}
        className="max-w-[16rem] truncate font-semibold text-vault-900"
      >
        {lead.name}
      </span>
    ) : (
      <Link
        to={href(lead)}
        title={lead.name}
        className="max-w-[10rem] shrink-0 truncate font-medium text-vault-500 transition-colors hover:text-vault-900"
      >
        {lead.name}
      </Link>
    );

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
      {leadNode}

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
              <MenuItem key={item.id} onSelect={() => navigate(href(item))}>
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
                to={href(item)}
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
