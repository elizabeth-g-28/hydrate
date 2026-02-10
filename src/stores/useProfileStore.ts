import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, ActivityLevel, Gender, UnitSystem, Theme } from '../types';
import { calculateDailyGoal } from '../utils/hydration';

interface ProfileState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  recalculateGoal: () => void;
}

const DEFAULT_PROFILE: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  age: 25,
  weight: 70,
  gender: 'male' as Gender,
  activityLevel: 'moderate' as ActivityLevel,
  wakeTime: '07:00',
  sleepTime: '23:00',
  dailyGoal: 2500,
  manualGoalOverride: false,
  unitSystem: 'metric' as UnitSystem,
  theme: 'dark' as Theme,
  onboardingComplete: false,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,

      setProfile: (profile) => set({ profile }),

      updateProfile: (updates) => {
        const current = get().profile;
        if (!current) return;

        const updated = {
          ...current,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        // Recalculate goal if relevant fields changed and no manual override
        if (
          !updated.manualGoalOverride &&
          (updates.weight !== undefined ||
            updates.activityLevel !== undefined)
        ) {
          updated.dailyGoal = calculateDailyGoal(
            updated.weight,
            updated.activityLevel
          );
        }

        set({ profile: updated });
      },

      recalculateGoal: () => {
        const current = get().profile;
        if (!current || current.manualGoalOverride) return;
        const newGoal = calculateDailyGoal(current.weight, current.activityLevel);
        set({
          profile: { ...current, dailyGoal: newGoal, updatedAt: new Date().toISOString() },
        });
      },
    }),
    {
      name: 'hydrate-profile',
    }
  )
);

export const createDefaultProfile = (): UserProfile => ({
  ...DEFAULT_PROFILE,
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
