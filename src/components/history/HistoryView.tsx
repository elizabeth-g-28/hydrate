import { useEffect, useState } from 'react';
import { Calendar, Droplets, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProfileStore } from '../../stores/useProfileStore';
import { useWaterStore } from '../../stores/useWaterStore';
import { formatAmount, formatTime, getDateString, getDayLabel } from '../../utils/hydration';

export const HistoryView = () => {
  const profile = useProfileStore((s) => s.profile);
  const { historyWeek, loadHistoryWeek } = useWaterStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string>(getDateString());

  useEffect(() => {
    void loadHistoryWeek(weekOffset);
  }, [weekOffset, loadHistoryWeek]);

  if (!profile) return null;

  const { dailyGoal, unitSystem } = profile;
  const selectedDayData = historyWeek.find((d) => d.date === selectedDay);
  const maxTotal = Math.max(dailyGoal, ...historyWeek.map((d) => d.total));
  const chartHeight = 128;

  const getBarHeightPx = (total: number): number => {
    if (total === 0) return 4;
    if (maxTotal === 0) return 4;
    return Math.max(4, (total / maxTotal) * chartHeight);
  };

  return (
    <div className="px-4 pb-24 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-hydro-accent" />
          <h1 className="text-xl font-bold text-white">History</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            tabIndex={0}
            aria-label="Previous week"
            className="p-2 rounded-lg hover:bg-hydro-card transition-colors"
          >
            <ChevronLeft size={18} className="text-hydro-text-muted" />
          </button>
          <span className="text-sm text-hydro-text-muted font-medium min-w-[80px] text-center">
            {weekOffset === 0 ? 'This Week' : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago`}
          </span>
          <button
            onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
            tabIndex={0}
            aria-label="Next week"
            disabled={weekOffset === 0}
            className="p-2 rounded-lg hover:bg-hydro-card transition-colors disabled:opacity-30"
          >
            <ChevronRight size={18} className="text-hydro-text-muted" />
          </button>
        </div>
      </div>

      <div className="glass-card p-4 mb-6">
        <div className="relative" style={{ height: chartHeight }}>
          <div
            className="absolute left-0 right-0 border-t border-dashed border-hydro-accent/30 pointer-events-none z-10"
            style={{ bottom: maxTotal > 0 ? (dailyGoal / maxTotal) * chartHeight : 0 }}
          />
          <div className="flex items-end justify-between gap-2 h-full">
          {historyWeek.map((day) => {
            const barHeightPx = getBarHeightPx(day.total);
            const goalMet = day.total >= dailyGoal;
            const isSelected = day.date === selectedDay;

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDay(day.date)}
                tabIndex={0}
                aria-label={`${getDayLabel(day.date)}: ${formatAmount(day.total, unitSystem)}`}
                className="flex-1 flex flex-col items-center gap-1 h-full min-h-0 group cursor-pointer"
              >
                <span className="text-[10px] text-hydro-text-muted font-medium h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatAmount(day.total, unitSystem)}
                </span>
                <div className="flex-1 w-full flex items-end justify-center min-h-0">
                  <div
                    className={`w-full max-w-[32px] rounded-t-lg transition-all duration-500 ${
                      goalMet ? 'bg-hydro-accent' : 'bg-hydro-accent/40'
                    } ${isSelected ? 'ring-2 ring-hydro-accent ring-offset-2 ring-offset-hydro-card' : ''}`}
                    style={{ height: barHeightPx }}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    isSelected ? 'text-hydro-accent' : 'text-hydro-text-muted'
                  }`}
                >
                  {getDayLabel(day.date)}
                </span>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      {selectedDayData && (
        <div className="glass-card p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">{getDayLabel(selectedDayData.date)}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-hydro-accent">
                {formatAmount(selectedDayData.total, unitSystem)}
              </span>
              <span className="text-xs text-hydro-text-muted">
                / {formatAmount(dailyGoal, unitSystem)}
              </span>
            </div>
          </div>

          <div className="w-full h-2 bg-hydro-bg rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-hydro-accent rounded-full transition-all duration-500"
              style={{ width: `${Math.min((selectedDayData.total / dailyGoal) * 100, 100)}%` }}
            />
          </div>

          {selectedDayData.entries.length === 0 ? (
            <p className="text-sm text-hydro-text-muted text-center py-4">No entries for this day</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedDayData.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-hydro-bg/50"
                >
                  <div className="flex items-center gap-2">
                    <Droplets size={14} className="text-hydro-accent" />
                    <span className="text-sm font-medium text-hydro-text">
                      {formatAmount(entry.amount, unitSystem)}
                    </span>
                  </div>
                  <span className="text-xs text-hydro-text-muted">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
