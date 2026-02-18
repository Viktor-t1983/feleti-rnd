import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

import { useAuth } from '../../contexts/AuthContext';
import { ru } from '../../i18n/ru';
import { cn } from '../../lib/utils';

const registerSchema = z.object({
  email: z.string().email(ru.validation.invalidEmail),
  username: z.string().min(1, ru.auth.username + ' ' + ru.validation.required),
  password: z.string().min(1, ru.validation.passwordRequired),
  fullName: z.string().min(1, ru.auth.fullName + ' ' + ru.validation.required),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function RegisterForm({ onSuccess, className }: RegisterFormProps): JSX.Element {
  const { register: registerUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      fullName: '',
    },
  });

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    try {
      await registerUser(data);
      toast.success('Регистрация успешна!');
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : ru.auth.registrationFailed;
      toast.error(message);
      setError('root', {
        type: 'manual',
        message,
      });
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      className={cn('space-y-4', className)}
      noValidate
    >
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {ru.auth.email}
        </label>
        <input
          id="email"
          data-testid="register-email"
          type="email"
          {...register('email')}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="you@example.com"
          aria-invalid={errors.email ? 'true' : 'false'}
        />
        {errors.email ? (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {ru.auth.username}
        </label>
        <input
          id="username"
          data-testid="register-username"
          type="text"
          {...register('username')}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="johndoe"
          aria-invalid={errors.username ? 'true' : 'false'}
        />
        {errors.username ? (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.username.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {ru.auth.password}
        </label>
        <input
          id="password"
          data-testid="register-password"
          type="password"
          {...register('password')}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="•••••••"
          aria-invalid={errors.password ? 'true' : 'false'}
        />
        {errors.password ? (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {ru.auth.fullName}
        </label>
        <input
          id="fullName"
          data-testid="register-fullname"
          type="text"
          {...register('fullName')}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Иван Иванов"
          aria-invalid={errors.fullName ? 'true' : 'false'}
        />
        {errors.fullName ? (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.fullName.message}
          </p>
        ) : null}
      </div>

      {errors.root ? (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-sm text-red-800 dark:text-red-200" role="alert">
            {errors.root.message}
          </p>
        </div>
      ) : null}

      <button
        type="submit"
        data-testid="register-submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? ru.common.loading : ru.auth.register}
      </button>
    </form>
  );
}
