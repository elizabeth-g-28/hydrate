import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, ActivityLevel, Gender, UnitSystem, Theme } from '../types';
import { calculateDailyGoal } from '../utils/hydration';
import { updateProfile as apiUpdateProfile } from '../lib/api';
import { isApiEnabled } from '../lib/auth';

interface ProfileState {
  profile: UserProfile | null;
  setProfileLocal: (profile: UserProfile) => void;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  recalculateGoal: () => void;
  clearProfile: () => void;
}

const DEFAULT_PROFILE: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  weight: 70,
  gender: 'male' as Gender,
  activityLevel: 'moderate' as ActivityLevel,
  wakeTime: '07:00',
  sleepTime: '23:00',
  dailyGoal: 2500,
  manualGoalOverride: false,
  unitSystem: 'metric' as UnitSystem,
  theme: 'dark' as Theme,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  onboardingComplete: false,
};

const syncProfile = async (profile: UserProfile) => {
  if (!isApiEnabled()) return;
  try {
    await apiUpdateProfile(profile);
  } catch (error) {
    console.error('Failed to sync profile:', error);
  }
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,

      setProfileLocal: (profile) => set({ profile }),

      setProfile: (profile) => {
        set({ profile });
        syncProfile(profile);
      },

      updateProfile: (updates) => {
        const current = get().profile;
        if (!current) return;

        const updated = {
          ...current,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        if (
          !updated.manualGoalOverride &&
          (updates.weight !== undefined || updates.activityLevel !== undefined)
        ) {
          updated.dailyGoal = calculateDailyGoal(updated.weight, updated.activityLevel);
        }

        set({ profile: updated });
        syncProfile(updated);
      },

      recalculateGoal: () => {
        const current = get().profile;
        if (!current || current.manualGoalOverride) return;
        const newGoal = calculateDailyGoal(current.weight, current.activityLevel);
        const updated = { ...current, dailyGoal: newGoal, updatedAt: new Date().toISOString() };
        set({ profile: updated });
        syncProfile(updated);
      },

      clearProfile: () => set({ profile: null }),
    }),
    { name: 'hydrate-profile' }
  )
);

export const createDefaultProfile = (): UserProfile => ({
  ...DEFAULT_PROFILE,
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
export { isApiEnabled };