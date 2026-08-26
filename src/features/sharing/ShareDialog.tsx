import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  PiCheckBold,
  PiCopyBold,
  PiGlobeHemisphereWestFill,
  PiLinkBold,
  PiUserPlusBold,
} from 'react-icons/pi';
import {
  useCreateShareMutation,
  useGetSharesQuery,
  useRevokeShareMutation,
} from '@/api/share-api-ts/shareApi';
import type { ShareDto } from '@/api/share-api-ts/types';
import { Avatar } from '@/components/layout/Avatar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Dialog, DialogClose } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({
  recipientEmail: z.string().trim().email('Enter a valid email address'),
});

type Values = z.infer<typeof schema>;

const RESOURCE_LABEL: Record<string, string> = {
  DATA_ROOM: 'data room',
  FOLDER: 'folder',
  FILE: 'file',
};

export function ShareDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  resourceName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: 'DATA_ROOM' | 'FOLDER' | 'FILE';
  resourceId: string;
  resourceName: string;
}) {
  const { data: shares = [], isLoading } = useGetSharesQuery(
    { resourceType, resourceId },
    { skip: !open },
  );
  const [createShare, { isLoading: creating }] = useCreateShareMutation();
  const [revokeShare] = useRevokeShareMutation();
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { recipientEmail: '' } });

  const people = shares.filter((share) => share.kind === 'USER');
  const publicShare = shares.find((share) => share.kind === 'PUBLIC_LINK');
  const publicUrl = publicShare?.token
    ? `${window.location.origin}/share/${publicShare.token}`
    : null;
  const label = RESOURCE_LABEL[resourceType] ?? 'item';

  const invite = handleSubmit(async (values) => {
    try {
      await createShare({
        resourceType,
        resourceId,
        kind: 'USER',
        recipientEmail: values.recipientEmail.trim(),
      }).unwrap();
      toast.success(`${values.recipientEmail} now has read-only access`);
      reset({ recipientEmail: '' });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to share with that person'));
    }
  });

  const createLink = async () => {
    try {
      await createShare({ resourceType, resourceId, kind: 'PUBLIC_LINK' }).unwrap();
      toast.success('Public link created');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to create a public link'));
    }
  };

  const revoke = async (share: ShareDto, description: string) => {
    setRevokingId(share.id);
    try {
      await revokeShare(share.id).unwrap();
      toast.success(`Access revoked for ${description}`, {
        description: 'They lose access the next time they load the page.',
      });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to revoke access'));
    } finally {
      setRevokingId(null);
    }
  };

  const copy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed — select the link and copy it manually');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Share "${resourceName}"`}
      description={`Recipients get read-only access to this ${label}${
        resourceType === 'FILE' ? '' : ' and everything inside it'
      }.`}
      footer={
        <DialogClose asChild>
          <Button variant="secondary">Done</Button>
        </DialogClose>
      }
    >
      <section>
        <h3 className="mb-3 text-[11px] font-semibold tracking-wider text-vault-500 uppercase">
          Invite specific people
        </h3>
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-start"
          onSubmit={(event) => {
            event.preventDefault();
            void invite();
          }}
        >
          <Input
            type="email"
            placeholder="reviewer@acme.com"
            autoComplete="off"
            error={errors.recipientEmail?.message}
            {...register('recipientEmail')}
          />
          <Button type="submit" loading={creating} icon={<PiUserPlusBold />} className="h-10 shrink-0">
            Invite
          </Button>
        </form>

        <div className="mt-4">
          {isLoading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : people.length === 0 ? (
            <p className="text-[12px] text-vault-400">
              No one has been invited yet. They'll need to sign in with this email address to view it.
            </p>
          ) : (
            <ul className="divide-y divide-vault-100 rounded-xl border border-vault-100">
              {people.map((share) => (
                <li key={share.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar size="sm" name={share.recipient?.name ?? share.recipientEmail ?? '?'} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-vault-900">
                      {share.recipient?.name ?? share.recipientEmail}
                    </p>
                    {share.recipient ? (
                      <p className="truncate text-[11px] text-vault-500">{share.recipient.email}</p>
                    ) : (
                      <p className="truncate text-[11px] text-vault-400">
                        Pending — no account with this email yet
                      </p>
                    )}
                  </div>
                  <Chip tone="neutral">Viewer</Chip>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={revokingId === share.id}
                    onClick={() =>
                      void revoke(share, share.recipient?.email ?? share.recipientEmail ?? 'this person')
                    }
                  >
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-8 border-t border-vault-100 pt-6">
        <h3 className="mb-3 text-[11px] font-semibold tracking-wider text-vault-500 uppercase">
          Public link
        </h3>

        {publicUrl && publicShare ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-center gap-2">
              <PiGlobeHemisphereWestFill className="shrink-0 text-amber-600" />
              <p className="text-[13px] font-medium text-amber-900">
                Anyone with this link can view it — no sign-in required.
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-vault-200 bg-white px-3 py-2 text-[11px] text-vault-700">
                {publicUrl}
              </code>
              <Button
                size="sm"
                variant="secondary"
                icon={copied ? <PiCheckBold className="text-emerald-600" /> : <PiCopyBold />}
                onClick={() => void copy()}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                loading={revokingId === publicShare.id}
                onClick={() => void revoke(publicShare, 'the public link')}
              >
                Revoke link
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-vault-100 bg-vault-50/50 p-4">
            <p className="text-[12px] text-vault-500">
              Create a link anyone can open, without an account.
            </p>
            <Button size="sm" loading={creating} icon={<PiLinkBold />} onClick={() => void createLink()}>
              Create public link
            </Button>
          </div>
        )}
      </section>
    </Dialog>
  );
}
