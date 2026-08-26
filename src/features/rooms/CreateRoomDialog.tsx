import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useCreateDataRoomMutation } from '@/api/data-room-api-ts/dataRoomApi';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogClose } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/errors';

const schema = z.object({
  name: z.string().trim().min(1, 'Give the data room a name').max(120, 'Keep it under 120 characters'),
});

type Values = z.infer<typeof schema>;

export function CreateRoomDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [createRoom, { isLoading }] = useCreateDataRoomMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '' } });

  useEffect(() => {
    if (!open) reset({ name: '' });
  }, [open, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      const room = await createRoom({ name: values.name.trim() }).unwrap();
      toast.success('Data room created');
      onOpenChange(false);
      navigate(`/rooms/${room.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to create the data room'));
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New data room"
      description="A data room is the top-level folder for one transaction. You can nest folders inside it once it exists."
      size="sm"
      footer={
        <>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button loading={isLoading} onClick={() => void submit()}>
            Create data room
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
          placeholder="Project Phoenix — Due Diligence"
          error={errors.name?.message}
          {...register('name')}
        />
      </form>
    </Dialog>
  );
}
