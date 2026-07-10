import { useEffect, useRef, useState } from 'react';
import { useProfileStore } from '../stores/useProfileStore';
import { useReminderStore } from '../stores/useReminderStore';
import { useWaterStore } from '../stores/useWaterStore';
import { sendNotification, hasPushSubscription } from '../utils/notifications';
import { formatAmount } from '../utils/hydration';

const isInDndWindow = (dndStart: string, dndEnd: string): boolean => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = dndStart.split(':').map(Number);
  const [endH, endM] = dndEnd.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
};

/**
 * In-app fallback reminders when the tab is open and push is not subscribed.
 * Closed-app reminders are handled by the backend push job + service worker.
 */
export const useReminders = (): void => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const profile = useProfileStore((s) => s.profile);
  const settings = useReminderStore((s) => s.settings);
  const todayTotal = useWaterStore((s) => s.todayTotal);
  const [pushReady, setPushReady] = useState(false);

  useEffect(() => {
    void hasPushSubscription().then(setPushReady);
  }, []);

  useEffect(() => {
    if (pushReady) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    if (!profile?.onboardingComplete || !settings.enabled || !settings.fixedInterval) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const checkAndNotify = () => {
      if (settings.dndEnabled && isInDndWindow(settings.dndStart, settings.dndEnd)) return;

      const remaining = profile.dailyGoal - todayTotal;
      if (remaining <= 0) return;

      const unit = profile.unitSystem;
      sendNotification(
        '💧 Time to hydrate!',
        `You've had ${formatAmount(todayTotal, unit)} today. ${formatAmount(remaining, unit)} to go!`,
        'hydro-interval'
      );
    };

    intervalRef.current = setInterval(
      checkAndNotify,
      settings.intervalMinutes * 60 * 1000
    );

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [profile, settings, todayTotal, pushReady]);
};
