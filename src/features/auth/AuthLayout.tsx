import type { ReactNode } from 'react';
import { PiShieldCheckFill } from 'react-icons/pi';

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-vault-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-vault-900 text-white">
            <PiShieldCheckFill className="text-2xl" />
          </span>
          {eyebrow ? (
            <p className="mb-2 text-[11px] font-semibold tracking-widest text-accent uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-vault-900">{title}</h1>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-vault-500">{description}</p>
        </div>

        <div className="rounded-2xl border border-vault-100 bg-white p-6 shadow-[var(--shadow-panel)]">
          {children}
        </div>

        <div className="mt-6 text-center text-[13px] text-vault-500">{footer}</div>
      </div>
    </div>
  );
}
