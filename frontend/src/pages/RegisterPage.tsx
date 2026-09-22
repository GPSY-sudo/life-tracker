import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { isValidEmail } from '@/utils/emailValidation';

export function RegisterPage() {
  const navigate = useNavigate();
  const { handleAuthSuccess } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.register({ name, email, password });
      handleAuthSuccess(response);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-surface-dark flex flex-col">
      <PublicNavbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

        <div className="bg-surface-card dark:bg-surface-dark-card rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-ink dark:text-slate-100 mb-1">Create an account</h1>
          <p className="text-sm text-ink-muted dark:text-slate-400 mb-6">Start tracking your life</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-ink dark:text-slate-300">
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Your name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-ink dark:text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-ink dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full pr-10"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted dark:text-slate-400 hover:text-ink dark:hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

          <p className="text-center text-sm text-ink-muted dark:text-slate-400 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
