import { create } from 'zustand';
import { db } from '../db';
import type { WaterEntry, DailySummary } from '../types';
import { getDateString, getWeekDates } from '../utils/hydration';

interface WaterState {
  todayEntries: WaterEntry[];
  todayTotal: number;
  weekSummaries: DailySummary[];
  isLoading: boolean;
  lastLogAnimation: number; // timestamp for triggering animation
  addEntry: (amount: number, note?: string) => Promise<void>;
  removeEntry: (id: number) => Promise<void>;
  loadTodayData: () => Promise<void>;
  loadWeekData: (goal: number) => Promise<void>;
  getStreak: (goal: number) => Promise<number>;
  getTotalDaysTracked: () => Promise<number>;
}

export const useWaterStore = create<WaterState>()((set, get) => ({
  todayEntries: [],
  todayTotal: 0,
  weekSummaries: [],
  isLoading: false,
  lastLogAnimation: 0,

  addEntry: async (amount, note) => {
    const now = new Date();
    const entry: WaterEntry = {
      amount,
      timestamp: now.toISOString(),
      date: getDateString(now),
      note,
    };

    await db.waterEntries.add(entry);
    set({ lastLogAnimation: Date.now() });
    await get().loadTodayData();
  },

  removeEntry: async (id) => {
    await db.waterEntries.delete(id);
    await get().loadTodayData();
  },

  loadTodayData: async () => {
    const today = getDateString();
    const entries = await db.waterEntries
      .where('date')
      .equals(today)
      .sortBy('timestamp');

    const total = entries.reduce((sum, e) => sum + e.amount, 0);
    set({ todayEntries: entries, todayTotal: total });
  },

  loadWeekData: async (goal) => {
    const dates = getWeekDates();
    const summaries: DailySummary[] = [];

    for (const date of dates) {
      const entries = await db.waterEntries.where('date').equals(date).toArray();
      const totalIntake = entries.reduce((sum, e) => sum + e.amount, 0);
      summaries.push({
        date,
        totalIntake,
        goal,
        entryCount: entries.length,
        goalMet: totalIntake >= goal,
      });
    }

    set({ weekSummaries: summaries });
  },

  getStreak: async (goal) => {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getDateString(d);
      const entries = await db.waterEntries.where('date').equals(dateStr).toArray();
      const total = entries.reduce((sum, e) => sum + e.amount, 0);

      // Skip today if no entries yet (don't break streak)
      if (i === 0 && total === 0) continue;

      if (total >= goal) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  },

  getTotalDaysTracked: async () => {
    const allEntries = await db.waterEntries.toArray();
    const uniqueDates = new Set(allEntries.map((e) => e.date));
    return uniqueDates.size;
  },
}));
