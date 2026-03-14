import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import type { SignUpDTO } from '../../types/api.types';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  name: z.string().min(2, 'Name too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  role: z.string().min(1, 'Select role'),
});

export default function SignUpScreen() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpDTO>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: SignUpDTO) => {
    try {
      const res = await authApi.signUp(data);
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
      <h2>Sign Up</h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="Name" {...register('name')} />
        <p className="error">{errors.name?.message}</p>

        <input placeholder="Email" {...register('email')} />
        <p className="error">{errors.email?.message}</p>

        <input
          type="password"
          placeholder="Password"
          {...register('password')}
        />
        <p className="error">{errors.password?.message}</p>

        <select {...register('role')}>
          <option value="">Select role</option>
          <option value="Driver">Driver</option>
          <option value="Operator">Operator</option>
        </select>
        <p className="error">{errors.role?.message}</p>

        <button disabled={isSubmitting}>
          {isSubmitting ? 'Loading...' : 'Sign Up'}
        </button>
      </form>

      <p>
        Already have account? <Link to="/sign-in">Sign In</Link>
      </p>
    </div>
  );
}