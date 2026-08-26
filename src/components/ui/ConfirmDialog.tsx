import { useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Dialog, DialogClose } from './Dialog';
import { Input } from './Input';

/**
 * Destructive confirmation — Vault 01 / 12. When `confirmPhrase` is set the
 * user has to type the resource name, which is what we do for large subtrees.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  body,
  confirmLabel,
  confirmPhrase,
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  body?: ReactNode;
  confirmLabel: string;
  confirmPhrase?: string;
  loading?: boolean;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState('');
  const [wasOpen, setWasOpen] = useState(open);

  // Reset while rendering rather than in an effect: no extra commit, and the
  // field is already empty on the frame the dialog appears.
  if (open !== wasOpen) {
    setWasOpen(open);
    setTyped('');
  }

  const blocked = Boolean(confirmPhrase) && typed.trim() !== confirmPhrase;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      icon={icon}
      size="sm"
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button variant="danger" loading={loading} disabled={blocked} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {body}
      {confirmPhrase ? (
        <div className="mt-4">
          <Input
            label={`Type "${confirmPhrase}" to confirm`}
            value={typed}
            autoComplete="off"
            onChange={(event) => setTyped(event.target.value)}
          />
        </div>
      ) : null}
    </Dialog>
  );
}
