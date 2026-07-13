import type { ActivityLevel, HydrationStatus, UnitSystem } from '../types';
import { ACTIVITY_MULTIPLIERS } from '../types';

export const calculateDailyGoal = (
  weightKg: number,
  activityLevel: ActivityLevel,
  hotWeather = false
): number => {
  const base = weightKg * 32.5; // midpoint of 30-35ml/kg
  const activityBonus = ACTIVITY_MULTIPLIERS[activityLevel];
  const climateBonus = hotWeather ? 500 : 0;
  return Math.round((base + activityBonus + climateBonus) / 50) * 50; // round to nearest 50
};

export const getHydrationStatus = (intake: number, goal: number): HydrationStatus => {
  const percentage = (intake / goal) * 100;
  if (percentage < 25) return 'dehydrated';
  if (percentage < 60) return 'under_hydrated';
  if (percentage <= 120) return 'well_hydrated';
  return 'over_hydrated';
};

export const getHydrationStatusLabel = (status: HydrationStatus): string => {
  const labels: Record<HydrationStatus, string> = {
    dehydrated: 'Dehydrated',
    under_hydrated: 'Under-hydrated',
    well_hydrated: 'Well Hydrated',
    over_hydrated: 'Over-hydrated',
  };
  return labels[status];
};

export const getHydrationColor = (status: HydrationStatus): string => {
  const colors: Record<HydrationStatus, string> = {
    dehydrated: 'text-red-400',
    under_hydrated: 'text-amber-400',
    well_hydrated: 'text-emerald-400',
    over_hydrated: 'text-blue-400',
  };
  return colors[status];
};

export const mlToOz = (ml: number): number => Math.round(ml * 0.033814 * 10) / 10;
export const ozToMl = (oz: number): number => Math.round(oz / 0.033814);

export const formatAmount = (ml: number, unit: UnitSystem): string => {
  if (unit === 'imperial') return `${mlToOz(ml)} oz`;
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)}L`;
  return `${ml}ml`;
};

export const getDateString = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

export const formatTime = (isoString: string): string => {
  return new Date(isoString).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const getWeekDates = (fromDate: Date = new Date()): string[] => {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(fromDate);
    d.setDate(d.getDate() - i);
    dates.push(getDateString(d));
  }
  return dates;
};

export const getDayLabel = (dateStr: string): string => {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const todayStr = getDateString(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getDateString(yesterday);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'short' });
};
