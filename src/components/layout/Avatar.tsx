import { initialsOf } from '@/lib/format';
import { cn } from '@/lib/utils';

/** There is no avatar field in the data model — initials, not stock photos. */
export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-strong',
        size === 'sm' ? 'size-6 text-[10px]' : 'size-8 text-[11px]',
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
