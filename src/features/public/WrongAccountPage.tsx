import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PiUserSwitchFill } from 'react-icons/pi';
import { api } from '@/api/api';
import { useMeQuery } from '@/api/auth-api-ts/authApi';
import { Avatar } from '@/components/layout/Avatar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { clearAuthToken } from '@/lib/auth-storage';

/**
 * Vault 07. The API separates "does not exist" (404) from "exists, but not
 * yours" (403), which is exactly the signal this screen needs: the resource is
 * real, the signed-in account simply is not the one it was shared with.
 */
export function WrongAccountPage({ returnTo }: { returnTo: string }) {
  const { data: user } = useMeQuery();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const switchAccount = () => {
    clearAuthToken();
    dispatch(api.util.resetApiState());
    navigate(`/login?next=${encodeURIComponent(returnTo)}`, { replace: true });
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-vault-50 p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <span className="flex size-16 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-3xl text-amber-600">
              <PiUserSwitchFill />
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-vault-900">
            This isn't shared with your account
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-vault-500">
            The item exists, but the account you're signed in with doesn't have access to it.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-vault-100 bg-white shadow-[var(--shadow-panel)]">
          {user ? (
            <div className="flex items-center justify-between gap-4 border-b border-vault-100 bg-vault-50/60 px-6 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={user.name} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-vault-900">{user.name}</p>
                  <p className="truncate text-[12px] text-vault-500">{user.email}</p>
                </div>
              </div>
              <Chip tone="neutral">Signed in</Chip>
            </div>
          ) : null}

          <div className="px-6 py-6">
            <p className="text-[13px] leading-relaxed text-vault-500">
              Permissioned shares are tied to one email address. If you have another account — a work
              address, for instance — switch to it. Otherwise ask the owner to invite
              {user ? ` ${user.email}` : ' your address'}.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button onClick={switchAccount}>Switch account</Button>
              <Button variant="secondary" onClick={() => navigate('/')}>
                Back to my data rooms
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
