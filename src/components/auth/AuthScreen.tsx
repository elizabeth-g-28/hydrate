import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { isGoogleAuthEnabled } from '../../lib/auth';
import { GoogleSignInButton } from './GoogleSignInButton';

interface AuthScreenProps {
  mode: 'login' | 'register';
}

export const AuthScreen = ({ mode }: AuthScreenProps) => {
  const isSignUp = mode === 'register';
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp, signIn, signInWithGoogle, loading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (!success) return;

    if (isSignUp) {
      navigate('/onboarding', { replace: true });
      return;
    }

    navigate('/home', { replace: true });
  };

  const handleGoogleSuccess = async (credential: string) => {
    const success = await signInWithGoogle(credential);
    if (!success) return;
    navigate('/home', { replace: true });
  };

  const handleGoogleError = () => {
    // Store error is set by signInWithGoogle on failure; popup cancel is silent
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-hydro-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-[#061224] ring-2 ring-hydro-accent/25 flex items-center justify-center">
            <img
              src="/logo-mark.png"
              alt=""
              className="w-[72%] h-[72%] object-contain"
            />
          </div>
          <p className="text-3xl font-bold tracking-tight text-white mb-4">Hydrate</p>
          <h1 className="text-lg font-semibold text-white/90 mb-1">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-hydro-text-muted">
            {isSignUp
              ? 'Sign up to sync your data across devices'
              : 'Sign in to access your data everywhere'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-hydro-text-muted mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-hydro-text-muted" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-hydro-card border border-hydro-border text-hydro-text placeholder:text-hydro-text-muted/50 focus:outline-none focus:ring-2 focus:ring-hydro-accent/50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-hydro-text-muted mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-hydro-text-muted" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-hydro-card border border-hydro-border text-hydro-text placeholder:text-hydro-text-muted/50 focus:outline-none focus:ring-2 focus:ring-hydro-accent/50"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-hydro-accent text-white rounded-xl font-semibold hover:bg-hydro-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-hydro-accent/20"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" />
                {isSignUp ? 'Creating Account...' : 'Signing In...'}
              </>
            ) : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {isGoogleAuthEnabled() && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-hydro-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-hydro-bg px-2 text-hydro-text-muted">or</span>
              </div>
            </div>
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              disabled={loading}
            />
          </>
        )}

        <div className="mt-6 text-center">
          <Link
            to={isSignUp ? '/login' : '/register'}
            className="text-sm text-hydro-text-muted hover:text-hydro-accent transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Link>
        </div>
      </div>
    </div>
  );
};
