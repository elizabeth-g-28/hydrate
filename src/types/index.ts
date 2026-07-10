export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type UnitSystem = 'metric' | 'imperial';

export type Theme = 'dark' | 'light';

export type HydrationStatus = 'dehydrated' | 'under_hydrated' | 'well_hydrated' | 'over_hydrated';

export type ReminderType = 'fixed_interval' | 'morning_boost' | 'post_meal' | 'pre_workout' | 'evening_winddown';

export interface UserProfile {
  id: string;
  name: string;
  weight: number; // in kg
  gender: Gender;
  activityLevel: ActivityLevel;
  wakeTime: string; // HH:mm
  sleepTime: string; // HH:mm
  dailyGoal: number; // in ml
  manualGoalOverride: boolean;
  unitSystem: UnitSystem;
  theme: Theme;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WaterEntry {
  id: string;
  amount: number; // in ml
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  totalIntake: number; // in ml
  goal: number; // in ml
  entryCount: number;
  goalMet: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  fixedInterval: boolean;
  intervalMinutes: number;
  morningBoost: boolean;
  postMeal: boolean;
  eveningWinddown: boolean;
  dndEnabled: boolean;
  dndStart: string; // HH:mm
  dndEnd: string; // HH:mm
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  requirement: number; // streak days or total days
  type: 'streak' | 'total_days' | 'single_day';
}

export const PRESET_AMOUNTS = [100, 250, 500, 750, 1000] as const;

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 0,
  light: 500,
  moderate: 750,
  active: 1000,
  very_active: 1500,
};

export interface ActivityOption {
  label: string;
  description: string;
  extraMl: string;
}

export const ACTIVITY_OPTIONS: Record<ActivityLevel, ActivityOption> = {
  sedentary: {
    label: 'Mostly Sitting',
    description: 'Desk job, minimal movement throughout the day',
    extraMl: '+0ml',
  },
  light: {
    label: 'Lightly Active',
    description: 'Walking, light housework, or casual strolls',
    extraMl: '+500ml',
  },
  moderate: {
    label: 'Moderately Active',
    description: 'Regular exercise 3-4 times a week, on your feet often',
    extraMl: '+750ml',
  },
  active: {
    label: 'Very Active',
    description: 'Daily workouts, physically demanding job, or sports',
    extraMl: '+1000ml',
  },
  very_active: {
    label: 'Athlete / Intense Training',
    description: 'Intense training twice a day or heavy manual labour',
    extraMl: '+1500ml',
  },
};

export const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: 'first_log', title: 'First Drop', description: 'Log your first water intake', icon: '💧', requirement: 1, type: 'total_days' },
  { id: 'first_goal', title: 'Goal Crusher', description: 'Meet your daily goal for the first time', icon: '🎯', requirement: 1, type: 'single_day' },
  { id: 'streak_3', title: 'Hydro Starter', description: '3-day streak of meeting your goal', icon: '🔥', requirement: 3, type: 'streak' },
  { id: 'streak_7', title: 'Week Warrior', description: '7-day streak of meeting your goal', icon: '⚡', requirement: 7, type: 'streak' },
  { id: 'streak_14', title: 'Hydration Hero', description: '14-day streak of meeting your goal', icon: '🦸', requirement: 14, type: 'streak' },
  { id: 'streak_30', title: 'Water Master', description: '30-day streak of meeting your goal', icon: '👑', requirement: 30, type: 'streak' },
  { id: 'days_7', title: 'One Week In', description: 'Track water for 7 days', icon: '📅', requirement: 7, type: 'total_days' },
  { id: 'days_30', title: 'Monthly Tracker', description: 'Track water for 30 days', icon: '🏆', requirement: 30, type: 'total_days' },
];
