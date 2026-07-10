import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useProfileStore } from '../stores/useProfileStore';
import { useReminderStore } from '../stores/useReminderStore';
import { useReminders } from '../hooks/useReminders';
import { hydrateFromApi } from '../lib/api';
import { isApiEnabled } from '../lib/auth';
import { hasPushSubscription, subscribeToPush } from '../utils/notifications';

const LoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-hydro-bg">
    <p className="text-hydro-text-muted">Loading...</p>
  </div>
);

/** Wraps all routes — bootstraps session, theme, and reminders */
export const RootLayout = () => {
  const { user, sessionReady, checkSession } = useAuthStore();
  const profile = useProfileStore((s) => s.profile);
  const remindersEnabled = useReminderStore((s) => s.settings.enabled);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (user && sessionReady && isApiEnabled()) {
      hydrateFromApi();
    }
  }, [user, sessionReady]);

  useEffect(() => {
    if (!user || !sessionReady || !isApiEnabled() || !remindersEnabled) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    void hasPushSubscription().then((has) => {
      if (!has) void subscribeToPush();
    });
  }, [user, sessionReady, remindersEnabled]);

  useEffect(() => {
    const root = document.documentElement;
    if (profile?.theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [profile?.theme]);

  useReminders();

  if (!sessionReady) return <LoadingScreen />;

  return <Outlet />;
};
