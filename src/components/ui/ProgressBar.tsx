import { cn } from '@/lib/utils';

export function ProgressBar({
  value,
  tone = 'accent',
  striped = false,
  className,
  label,
}: {
  value: number;
  tone?: 'accent' | 'dark' | 'success';
  striped?: boolean;
  className?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const fill =
    tone === 'accent' ? 'bg-accent' : tone === 'success' ? 'bg-emerald-500' : 'bg-vault-900';

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-vault-100', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-300', fill, striped && 'progress-stripes')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
