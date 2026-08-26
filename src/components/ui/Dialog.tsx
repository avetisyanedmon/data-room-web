import type { ComponentProps, ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { PiXBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import { IconButton } from './Button';

/**
 * Radix gives us the focus trap, Esc handling, scroll lock, portal and the
 * aria wiring the previous hand-rolled modal had none of.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const width = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="animate-overlay-in fixed inset-0 z-50 bg-vault-900/40 backdrop-blur-[3px]" />
        <RadixDialog.Content
          className={cn(
            'animate-fade-up fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-vault-100 bg-white shadow-[var(--shadow-float)]',
            width,
          )}
        >
          <div className="flex items-start gap-4 border-b border-vault-100 px-6 py-5">
            {icon}
            <div className="min-w-0 flex-1">
              <RadixDialog.Title className="text-base font-semibold text-vault-900">
                {title}
              </RadixDialog.Title>
              {description ? (
                <RadixDialog.Description asChild>
                  <div className="mt-1 text-[13px] leading-relaxed text-vault-500">
                    {description}
                  </div>
                </RadixDialog.Description>
              ) : null}
            </div>
            <RadixDialog.Close asChild>
              <IconButton label="Close">
                <PiXBold />
              </IconButton>
            </RadixDialog.Close>
          </div>

          {children ? <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div> : null}

          {footer ? (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-vault-100 bg-vault-50/60 px-6 py-4">
              {footer}
            </div>
          ) : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export function DialogClose(props: ComponentProps<typeof RadixDialog.Close>) {
  return <RadixDialog.Close {...props} />;
}
