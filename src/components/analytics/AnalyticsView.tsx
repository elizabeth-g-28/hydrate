import { useEffect, useState, useCallback } from 'react';
import { BarChart3, Flame, Trophy, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useProfileStore } from '../../stores/useProfileStore';
import { useWaterStore } from '../../stores/useWaterStore';
import { formatAmount, getDayLabel } from '../../utils/hydration';
import { ACHIEVEMENTS_LIST } from '../../types';

interface ChartData {
  day: string;
  intake: number;
  goal: number;
}

export const AnalyticsView = () => {
  const profile = useProfileStore((s) => s.profile);
  const { weekSummaries, loadWeekData, getStreak, getTotalDaysTracked, todayTotal } = useWaterStore();
  const [streak, setStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);

  const loadAnalytics = useCallback(async () => {
    if (!profile) return;
    await loadWeekData(profile.dailyGoal);
    const s = await getStreak(profile.dailyGoal);
    const d = await getTotalDaysTracked();
    setStreak(s);
    setTotalDays(d);
  }, [profile, loadWeekData, getStreak, getTotalDaysTracked]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics, todayTotal]);

  if (!profile) return null;

  const { dailyGoal, unitSystem } = profile;

  const chartData: ChartData[] = weekSummaries.map((s) => ({
    day: getDayLabel(s.date),
    intake: s.totalIntake,
    goal: dailyGoal,
  }));

  const weekAverage =
    weekSummaries.length > 0
      ? Math.round(weekSummaries.reduce((sum, s) => sum + s.totalIntake, 0) / weekSummaries.length)
      : 0;

  const goalMetDays = weekSummaries.filter((s) => s.goalMet).length;

  // Check unlocked achievements
  const unlockedAchievements = ACHIEVEMENTS_LIST.filter((a) => {
    if (a.type === 'streak') return streak >= a.requirement;
    if (a.type === 'total_days') return totalDays >= a.requirement;
    if (a.type === 'single_day') return todayTotal >= dailyGoal;
    return false;
  });

  const lockedAchievements = ACHIEVEMENTS_LIST.filter(
    (a) => !unlockedAchievements.find((u) => u.id === a.id)
  );

  return (
    <div className="px-4 pb-24 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 size={20} className="text-hydro-accent" />
        <h1 className="text-xl font-bold text-white">Analytics</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card p-3 text-center">
          <Flame size={20} className="mx-auto mb-1 text-orange-400" />
          <p className="text-2xl font-bold text-white">{streak}</p>
          <p className="text-[10px] text-hydro-text-muted uppercase tracking-wide">Day Streak</p>
        </div>
        <div className="glass-card p-3 text-center">
          <TrendingUp size={20} className="mx-auto mb-1 text-emerald-400" />
          <p className="text-2xl font-bold text-white">{formatAmount(weekAverage, unitSystem)}</p>
          <p className="text-[10px] text-hydro-text-muted uppercase tracking-wide">Week Avg</p>
        </div>
        <div className="glass-card p-3 text-center">
          <Trophy size={20} className="mx-auto mb-1 text-amber-400" />
          <p className="text-2xl font-bold text-white">{goalMetDays}/7</p>
          <p className="text-[10px] text-hydro-text-muted uppercase tracking-wide">Goals Met</p>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="glass-card p-4 mb-6">
        <h2 className="text-sm font-semibold text-hydro-text-muted mb-4 uppercase tracking-wide">
          Last 7 Days
        </h2>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}L` : `${v}`)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#132136',
                  border: '1px solid #1e3a5f',
                  borderRadius: '12px',
                  color: '#e2e8f0',
                  fontSize: '12px',
                }}
                formatter={(value) => [formatAmount(Number(value), unitSystem), 'Intake']}
              />
              <ReferenceLine
                y={dailyGoal}
                stroke="#38bdf8"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{
                  value: 'Goal',
                  position: 'right',
                  fill: '#38bdf8',
                  fontSize: 10,
                }}
              />
              <Bar dataKey="intake" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Achievements */}
      <div className="glass-card p-4">
        <h2 className="text-sm font-semibold text-hydro-text-muted mb-4 uppercase tracking-wide">
          Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS_LIST.length})
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {unlockedAchievements.map((a) => (
            <div
              key={a.id}
              className="p-3 rounded-xl bg-hydro-accent/10 border border-hydro-accent/20 animate-bounce-in"
            >
              <span className="text-2xl">{a.icon}</span>
              <p className="text-sm font-semibold text-white mt-1">{a.title}</p>
              <p className="text-[10px] text-hydro-text-muted">{a.description}</p>
            </div>
          ))}
          {lockedAchievements.map((a) => (
            <div
              key={a.id}
              className="p-3 rounded-xl bg-hydro-card border border-hydro-border opacity-50"
            >
              <span className="text-2xl grayscale">🔒</span>
              <p className="text-sm font-semibold text-hydro-text-muted mt-1">{a.title}</p>
              <p className="text-[10px] text-hydro-text-muted">{a.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
