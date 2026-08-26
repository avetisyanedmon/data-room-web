import type { ReactNode } from 'react';
import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

export function Menu({
  trigger,
  children,
  align = 'end',
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
}) {
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align={align}
          sideOffset={6}
          className="animate-fade-up z-50 min-w-52 rounded-xl border border-vault-100 bg-white p-1.5 shadow-[var(--shadow-float)]"
        >
          {children}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}

export function MenuItem({
  icon,
  onSelect,
  disabled,
  tone = 'default',
  children,
}: {
  icon?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
  children: ReactNode;
}) {
  return (
    <RadixMenu.Item
      disabled={disabled}
      onSelect={(event) => {
        event.preventDefault();
        onSelect?.();
      }}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium outline-none select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
        tone === 'danger'
          ? 'text-red-600 data-[highlighted]:bg-red-50'
          : 'text-vault-700 data-[highlighted]:bg-vault-100 data-[highlighted]:text-vault-900',
      )}
    >
      <span className="w-4 shrink-0 text-base text-vault-400">{icon}</span>
      {children}
    </RadixMenu.Item>
  );
}

export function MenuSeparator() {
  return <RadixMenu.Separator className="my-1 h-px bg-vault-100" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <RadixMenu.Label className="px-3 py-1.5 text-[10px] font-bold tracking-widest text-vault-400 uppercase">
      {children}
    </RadixMenu.Label>
  );
}
