import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon,
  title,
  description,
  actions,
  className,
  compact = false,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-6 py-12' : 'px-6 py-20',
        className,
      )}
    >
      {icon ? (
        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-vault-100 text-2xl text-vault-400">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-vault-900">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-vault-500">{description}</p>
      ) : null}
      {actions ? <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}
