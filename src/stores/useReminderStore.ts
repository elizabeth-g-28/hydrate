import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReminderSettings } from '../types';
import { updateReminders as apiUpdateReminders } from '../lib/api';
import { isApiEnabled } from '../lib/auth';

interface ReminderState {
  settings: ReminderSettings;
  setSettingsLocal: (settings: ReminderSettings) => void;
  updateSettings: (updates: Partial<ReminderSettings>) => void;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  fixedInterval: true,
  intervalMinutes: 60,
  morningBoost: true,
  postMeal: true,
  eveningWinddown: true,
  dndEnabled: false,
  dndStart: '22:00',
  dndEnd: '07:00',
};

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,

      setSettingsLocal: (settings) => set({ settings }),

      updateSettings: (updates) => {
        const updated = { ...get().settings, ...updates };
        set({ settings: updated });

        if (isApiEnabled()) {
          apiUpdateReminders(updated).catch((err) =>
            console.error('Failed to sync reminders:', err)
          );
        }
      },
    }),
    { name: 'hydrate-reminders' }
  )
);
