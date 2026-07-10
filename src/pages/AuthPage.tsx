import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useProfileStore } from '../stores/useProfileStore';
import { AuthScreen } from '../components/auth/AuthScreen';

type AuthPageProps = {
  mode: 'login' | 'register';
};

/** Redirect to app if already signed in */
export const AuthPage = ({ mode }: AuthPageProps) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);

  useEffect(() => {
    if (!user) return;
    navigate(profile?.onboardingComplete ? '/home' : '/onboarding', { replace: true });
  }, [user, profile, navigate]);

  if (user) return null;

  return <AuthScreen mode={mode} />;
};
