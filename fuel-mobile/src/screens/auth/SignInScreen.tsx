import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import type { SignInDTO } from '../../types/api.types';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
});

export default function SignInScreen() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInDTO>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: SignInDTO) => {
    try {
      const res = await authApi.signIn(data);
      await setTokens(res.data.accessToken, res.data.refreshToken);
      navigate('/');
    } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Помилка:', err.message);
        } else {
          console.error('Невідома помилка', err);
        }
      }
  };

  return (
    <div className="container">
      <h2>Sign In</h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="Email" {...register('email')} />
        <p className="error">{errors.email?.message}</p>

        <input
          type="password"
          placeholder="Password"
          {...register('password')}
        />
        <p className="error">{errors.password?.message}</p>

        <button disabled={isSubmitting}>
          {isSubmitting ? 'Loading...' : 'Sign In'}
        </button>
      </form>

      <p>
        Don't have account? <Link to="/sign-up">Sign Up</Link>
      </p>
    </div>
  );
}