import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useProfileStore } from '../stores/useProfileStore';
import { useReminders } from '../hooks/useReminders';
import { hydrateFromApi } from '../lib/api';
import { isApiEnabled } from '../lib/auth';
import { LoadingScreen } from '../components/common/LoadingScreen';

/** Wraps all routes — bootstraps session, theme, and reminders */
export const RootLayout = () => {
  const { user, sessionReady, checkSession } = useAuthStore();
  const profile = useProfileStore((s) => s.profile);
  const [hydrateState, setHydrateState] = useState<{ userId: string; done: boolean } | null>(
    null
  );

  const needsHydrate = Boolean(user && isApiEnabled());
  const dataReady =
    !needsHydrate || (hydrateState?.userId === user?.id && hydrateState?.done === true);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!sessionReady || !needsHydrate || !user) return;

    const userId = user.id;
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (!cancelled) setHydrateState({ userId, done: false });
    });

    void hydrateFromApi().finally(() => {
      if (!cancelled) setHydrateState({ userId, done: true });
    });

    return () => {
      cancelled = true;
    };
  }, [user, sessionReady, needsHydrate]);

  useEffect(() => {
    const root = document.documentElement;
    if (profile?.theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [profile?.theme]);

  useEffect(() => {
    if (!profile?.onboardingComplete) return;
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    if (profile.timezone !== browserTz) {
      useProfileStore.getState().updateProfile({ timezone: browserTz });
    }
  }, [profile?.id, profile?.onboardingComplete, profile?.timezone]);

  useReminders();

  if (!sessionReady || !dataReady) return <LoadingScreen />;

  return <Outlet />;
};
