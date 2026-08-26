import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useRegisterMutation } from '@/api/auth-api-ts/authApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/errors';
import { AuthLayout } from './AuthLayout';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(80, 'Keep it under 80 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(72, 'Keep it under 72 characters'),
});

type Values = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const [createAccount, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await createAccount({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      }).unwrap();
      navigate(next ?? '/', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to create your account'));
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      description="Set up a workspace for your transaction documents. It takes a few seconds."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
            className="font-semibold text-accent-strong hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Sarah Jenkins"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          hint="Invitations are matched to this address."
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
