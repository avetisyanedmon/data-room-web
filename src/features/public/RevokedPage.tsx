import { Link } from 'react-router-dom';
import { PiLinkBreakBold } from 'react-icons/pi';

/** Vault 06 — a token that was revoked, deleted or never existed. */
export function RevokedPage({
  title = 'This link is no longer available',
  description = 'The owner has revoked access to this data room, or the link has expired.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-vault-900 p-6 text-white">
      <div className="pointer-events-none absolute -top-64 -left-64 size-[600px] rounded-full bg-accent/5 blur-[120px]" />
      <div className="pointer-events-none absolute -right-64 -bottom-64 size-[600px] rounded-full bg-red-600/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-lg text-center">
        <div className="mb-10 flex justify-center">
          <div className="flex size-24 items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/10 text-4xl text-red-500">
            <PiLinkBreakBold />
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-balance">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/50">{description}</p>

        <div className="mt-10">
          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-8 text-[13px] font-semibold text-white transition-colors hover:bg-accent-strong"
          >
            Sign in to your account
          </Link>
        </div>

        <div className="mx-auto mt-20 grid max-w-sm grid-cols-2 gap-8 text-left">
          <div>
            <h2 className="mb-2 text-[11px] font-bold tracking-widest text-white/40 uppercase">
              Wrong link?
            </h2>
            <p className="text-[12px] leading-relaxed text-white/50">
              Check the URL for missing characters, then ask the sender to share it again.
            </p>
          </div>
          <div>
            <h2 className="mb-2 text-[11px] font-bold tracking-widest text-white/40 uppercase">
              Need access?
            </h2>
            <p className="text-[12px] leading-relaxed text-white/50">
              The owner can invite your email address directly, which keeps the documents private to
              you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
