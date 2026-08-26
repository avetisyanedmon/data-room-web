import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useLoginMutation } from '@/api/auth-api-ts/authApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/errors';
import { AuthLayout } from './AuthLayout';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type Values = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const submit = handleSubmit(async (values) => {
    try {
      await login({ email: values.email.trim(), password: values.password }).unwrap();
      navigate(next ?? '/', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Those credentials did not work'));
    }
  });

  return (
    <AuthLayout
      eyebrow={next ? 'Shared with you' : undefined}
      title={next ? 'Sign in to view this' : 'Sign in'}
      description={
        next
          ? 'This item was shared with a specific email address. Sign in with that address to open it.'
          : 'Access your secure due diligence data rooms.'
      }
      footer={
        <>
          Need an account?{' '}
          <Link
            to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}
            className="font-semibold text-accent-strong hover:underline"
          >
            Create one
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
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
