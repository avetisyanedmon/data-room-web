import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
};

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-vault-900 text-white border border-vault-900 hover:bg-black disabled:hover:bg-vault-900',
  secondary:
    'bg-white text-vault-700 border border-vault-200 hover:bg-vault-50 disabled:hover:bg-white',
  ghost: 'bg-transparent text-vault-600 border border-transparent hover:bg-vault-100',
  danger: 'bg-red-600 text-white border border-red-600 hover:bg-red-700',
  dark: 'bg-white/10 text-white border border-white/15 hover:bg-white/20',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-[13px] gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
};

/**
 * Keeps its label while loading — the previous implementation swapped children
 * for "Please wait…", which resized the control and dropped its icon.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon, className, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg font-semibold whitespace-nowrap transition-colors disabled:opacity-55',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className="size-3.5" /> : icon}
      {children}
    </button>
  );
});

export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: Variant }
>(function IconButton({ label, variant = 'ghost', className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
