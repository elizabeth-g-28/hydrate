import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReminderSettings } from '../types';

interface ReminderState {
  settings: ReminderSettings;
  updateSettings: (updates: Partial<ReminderSettings>) => void;
}

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      settings: {
        enabled: true,
        fixedInterval: true,
        intervalMinutes: 60,
        morningBoost: true,
        postMeal: true,
        eveningWinddown: true,
        dndEnabled: false,
        dndStart: '22:00',
        dndEnd: '07:00',
      },

      updateSettings: (updates) => {
        set({ settings: { ...get().settings, ...updates } });
      },
    }),
    {
      name: 'hydrate-reminders',
    }
  )
);
