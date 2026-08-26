import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  PiDotsThreeVerticalBold,
  PiFolderSimpleFill,
  PiListBold,
  PiShieldCheckFill,
  PiSignOutBold,
  PiSquaresFourFill,
  PiUsersThreeBold,
  PiXBold,
} from 'react-icons/pi';
import { api } from '@/api/api';
import { useGetDataRoomsQuery } from '@/api/data-room-api-ts/dataRoomApi';
import { useMeQuery } from '@/api/auth-api-ts/authApi';
import { IconButton } from '@/components/ui/Button';
import { Menu, MenuItem } from '@/components/ui/Menu';
import { clearAuthToken } from '@/lib/auth-storage';
import { cn } from '@/lib/utils';
import { UploadDrawer } from '@/features/upload/UploadDrawer';
import { Avatar } from './Avatar';
import { OfflineBanner } from './OfflineBanner';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: user } = useMeQuery();
  const { data: rooms } = useGetDataRoomsQuery();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const signOut = () => {
    clearAuthToken();
    dispatch(api.util.resetApiState());
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-vault-100 px-6">
        <span className="flex size-9 items-center justify-center rounded-lg bg-vault-900 text-white">
          <PiShieldCheckFill className="text-xl" />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] leading-none font-semibold tracking-tight text-vault-900">Data Room</p>
          <p className="mt-1 truncate text-[11px] text-vault-500">Secure document exchange</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <NavLink
          to="/"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
              isActive
                ? 'bg-vault-50 font-semibold text-vault-900'
                : 'text-vault-600 hover:bg-vault-50 hover:text-vault-900',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? (
                <span className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-md bg-vault-900" />
              ) : null}
              <PiSquaresFourFill className="text-lg" />
              All data rooms
            </>
          )}
        </NavLink>

        {rooms?.owned.length ? (
          <div className="mt-6 border-t border-vault-100 pt-5">
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-vault-500 uppercase">
              Your rooms
            </p>
            {rooms.owned.slice(0, 8).map((room) => (
              <NavLink
                key={room.id}
                to={`/rooms/${room.id}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
                    isActive
                      ? 'bg-vault-50 font-semibold text-vault-900'
                      : 'text-vault-600 hover:bg-vault-50 hover:text-vault-900',
                  )
                }
              >
                <PiFolderSimpleFill className="shrink-0 text-vault-400" />
                <span className="truncate">{room.name}</span>
              </NavLink>
            ))}
          </div>
        ) : null}

        {rooms?.shared.length ? (
          <div className="mt-6 border-t border-vault-100 pt-5">
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-vault-500 uppercase">
              Shared with you
            </p>
            {rooms.shared.slice(0, 8).map((entry) => (
              <Link
                key={entry.shareId}
                to={`/rooms/${entry.dataRoom.id}`}
                onClick={onNavigate}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-vault-600 transition-colors hover:bg-vault-50 hover:text-vault-900"
              >
                <PiUsersThreeBold className="shrink-0 text-vault-400" />
                <span className="truncate">{entry.dataRoom.name}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </nav>

      {user ? (
        <div className="flex items-center gap-3 border-t border-vault-100 px-4 py-4">
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-vault-900">{user.name}</p>
            <p className="truncate text-[11px] text-vault-500">{user.email}</p>
          </div>
          <Menu
            align="start"
            trigger={
              <IconButton label="Account menu">
                <PiDotsThreeVerticalBold />
              </IconButton>
            }
          >
            <MenuItem icon={<PiSignOutBold />} onSelect={signOut}>
              Sign out
            </MenuItem>
          </Menu>
        </div>
      ) : null}
    </div>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-svh w-full overflow-hidden bg-vault-50">
      <aside className="hidden w-[260px] shrink-0 border-r border-vault-100 md:block">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="animate-overlay-in absolute inset-0 bg-vault-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[280px] shadow-[var(--shadow-float)]">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
          <IconButton
            label="Close navigation"
            variant="dark"
            className="absolute top-4 right-4"
            onClick={() => setMobileOpen(false)}
          >
            <PiXBold />
          </IconButton>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <OfflineBanner />
        <div className="flex items-center gap-3 border-b border-vault-100 bg-white px-4 py-3 md:hidden">
          <IconButton label="Open navigation" onClick={() => setMobileOpen(true)}>
            <PiListBold className="text-lg" />
          </IconButton>
          <span className="flex items-center gap-2 text-[13px] font-semibold text-vault-900">
            <PiShieldCheckFill className="text-vault-900" /> Data Room
          </span>
        </div>
        <Outlet />
      </div>

      <UploadDrawer />
    </div>
  );
}
