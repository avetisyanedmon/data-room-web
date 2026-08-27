import { Link, useNavigate } from 'react-router-dom';
import { PiCaretRightBold, PiDotsThreeBold } from 'react-icons/pi';
import type { BreadcrumbDto } from '@/api/data-room-api-ts/types';
import { IconButton } from '@/components/ui/Button';
import { Menu, MenuItem, MenuLabel } from '@/components/ui/Menu';
import { collapseTrail } from '@/lib/breadcrumb-trail';

/**
 * The recipient's trail through a public link — the dark counterpart of the
 * explorer's `Breadcrumbs`.
 *
 * The server has already trimmed the trail to the shared scope, so the first
 * entry is the top level this visitor can reach and every crumb here is safe to
 * offer. That first entry links to the bare `/share/:token`, which is the same
 * folder by another name and the only URL that works before a folder is chosen.
 */
export function PublicBreadcrumbs({
  token,
  items,
}: {
  token: string;
  items: BreadcrumbDto[];
}) {
  const navigate = useNavigate();
  const { lead, hidden, shown, collapsed } = collapseTrail(items);

  if (!lead) {
    return null;
  }

  const href = (item: BreadcrumbDto) =>
    item.id === lead.id ? `/share/${token}` : `/share/${token}/f/${item.id}`;

  const currentClass = 'max-w-[16rem] truncate font-semibold text-white';
  const linkClass =
    'max-w-[10rem] truncate text-white/50 transition-colors hover:text-white';

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1.5 text-[13px]"
    >
      {shown.length === 0 ? (
        <span aria-current="page" title={lead.name} className={currentClass}>
          {lead.name}
        </span>
      ) : (
        <Link to={href(lead)} title={lead.name} className={`shrink-0 ${linkClass}`}>
          {lead.name}
        </Link>
      )}

      {collapsed ? (
        <>
          <PiCaretRightBold className="shrink-0 text-[9px] text-white/30" />
          <Menu
            align="start"
            trigger={
              <IconButton
                label="Show hidden folders"
                variant="dark"
                className="size-6"
              >
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
            <PiCaretRightBold className="shrink-0 text-[9px] text-white/30" />
            {isLast ? (
              <span aria-current="page" title={item.name} className={currentClass}>
                {item.name}
              </span>
            ) : (
              <Link to={href(item)} title={item.name} className={linkClass}>
                {item.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
