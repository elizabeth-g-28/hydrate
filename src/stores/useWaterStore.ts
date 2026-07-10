import { create } from 'zustand';
import type { WaterEntry, DailySummary } from '../types';
import { getDateString, getWeekDates } from '../utils/hydration';
import {
  getWaterEntries,
  getWaterSummaries,
  addWaterEntry as apiAddWaterEntry,
  deleteWaterEntry as apiDeleteWaterEntry,
} from '../lib/api';
import { isApiEnabled } from '../lib/auth';

interface WaterState {
  todayEntries: WaterEntry[];
  todayTotal: number;
  weekSummaries: DailySummary[];
  streak: number;
  totalDays: number;
  isLoading: boolean;
  lastLogAnimation: number;
  addEntry: (amount: number, note?: string) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  loadTodayData: () => Promise<void>;
  loadWeekData: (goal: number) => Promise<void>;
  loadAnalyticsStats: (goal: number) => Promise<void>;
  getStreak: (goal: number) => Promise<number>;
  getTotalDaysTracked: () => Promise<number>;
}

const computeStreak = (
  summaries: { date: string; totalIntake: number }[],
  goal: number
): number => {
  const totals = new Map(summaries.map((s) => [s.date, s.totalIntake]));
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = getDateString(d);
    const total = totals.get(dateStr) ?? 0;

    if (i === 0 && total === 0) continue;

    if (total >= goal) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

export const useWaterStore = create<WaterState>()((set, get) => ({
  todayEntries: [],
  todayTotal: 0,
  weekSummaries: [],
  streak: 0,
  totalDays: 0,
  isLoading: false,
  lastLogAnimation: 0,

  addEntry: async (amount, note) => {
    if (!isApiEnabled()) {
      throw new Error('Backend not configured. Set VITE_API_URL in .env');
    }

    const now = new Date();
    const entry: Omit<WaterEntry, 'id'> = {
      amount,
      timestamp: now.toISOString(),
      date: getDateString(now),
      note,
    };

    await apiAddWaterEntry(entry);
    set({ lastLogAnimation: Date.now() });
    await get().loadTodayData();
  },

  removeEntry: async (id) => {
    await apiDeleteWaterEntry(id);
    await get().loadTodayData();
  },

  loadTodayData: async () => {
    if (!isApiEnabled()) return;

    set({ isLoading: true });
    try {
      const today = getDateString();
      const { entries } = await getWaterEntries({ date: today });
      const total = entries.reduce((sum, e) => sum + e.amount, 0);
      set({ todayEntries: entries, todayTotal: total });
    } finally {
      set({ isLoading: false });
    }
  },

  loadWeekData: async (goal) => {
    if (!isApiEnabled()) return;

    const dates = getWeekDates();
    const { entries } = await getWaterEntries({ from: dates[0], to: dates[dates.length - 1] });
    const summaries: DailySummary[] = dates.map((date) => {
      const dayEntries = entries.filter((e) => e.date === date);
      const totalIntake = dayEntries.reduce((sum, e) => sum + e.amount, 0);
      return {
        date,
        totalIntake,
        goal,
        entryCount: dayEntries.length,
        goalMet: totalIntake >= goal,
      };
    });
    set({ weekSummaries: summaries });
  },

  loadAnalyticsStats: async (goal) => {
    await get().loadWeekData(goal);
    const { summaries } = await getWaterSummaries(365);
    set({
      streak: computeStreak(summaries, goal),
      totalDays: summaries.filter((s) => s.totalIntake > 0).length,
    });
  },

  getStreak: async (goal) => {
    if (!isApiEnabled()) return 0;

    const { summaries } = await getWaterSummaries(365);
    return computeStreak(summaries, goal);
  },

  getTotalDaysTracked: async () => {
    if (!isApiEnabled()) return 0;
    const { summaries } = await getWaterSummaries(365);
    return summaries.filter((s) => s.totalIntake > 0).length;
  },
}));
