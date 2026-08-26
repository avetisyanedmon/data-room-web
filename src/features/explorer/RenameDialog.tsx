import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogClose } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/errors';

export function RenameDialog({
  open,
  onOpenChange,
  title,
  initialName,
  loading = false,
  takenNames = [],
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialName: string;
  loading?: boolean;
  /** Sibling names, so a collision is flagged before the request goes out. */
  takenNames?: string[];
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string>();
  const [openedWith, setOpenedWith] = useState(open ? initialName : null);

  // Re-seed the field each time the dialog opens, during render.
  if (open && openedWith !== initialName) {
    setOpenedWith(initialName);
    setName(initialName);
    setError(undefined);
  }
  if (!open && openedWith !== null) {
    setOpenedWith(null);
  }

  const trimmed = name.trim();
  const collides =
    trimmed.length > 0 &&
    trimmed !== initialName &&
    takenNames.some((taken) => taken.toLowerCase() === trimmed.toLowerCase());

  const submit = async () => {
    if (!trimmed) {
      setError('Name cannot be empty');
      return;
    }
    if (trimmed === initialName) {
      onOpenChange(false);
      return;
    }
    try {
      await onSubmit(trimmed);
      onOpenChange(false);
    } catch (caught) {
      const message = getErrorMessage(caught, 'Unable to rename');
      setError(message);
      toast.error(message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button loading={loading} onClick={() => void submit()}>
            Save
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Input
          label="Name"
          autoFocus
          value={name}
          error={error}
          hint={
            collides
              ? 'An item with this name already exists here — it will be saved with a number appended.'
              : undefined
          }
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
        />
      </form>
    </Dialog>
  );
}
