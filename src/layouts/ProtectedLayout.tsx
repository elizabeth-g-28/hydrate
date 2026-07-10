import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useProfileStore } from '../stores/useProfileStore';
import { isApiEnabled } from '../lib/auth';

/**
 * Single protected layout — handles auth + onboarding redirects.
 * Child routes: /onboarding and the main app (tabs).
 */
export const ProtectedLayout = () => {
  const { user } = useAuthStore();
  const profile = useProfileStore((s) => s.profile);
  const { pathname } = useLocation();

  if (isApiEnabled() && !user) {
    return <Navigate to="/login" replace />;
  }

  const onboardingDone = profile?.onboardingComplete;
  const onOnboarding = pathname === '/onboarding';

  if (!onboardingDone && !onOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (onboardingDone && onOnboarding) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};
