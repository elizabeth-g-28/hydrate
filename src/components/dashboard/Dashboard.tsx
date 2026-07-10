import { useState } from 'react';
import { Minus, Plus, Droplets } from 'lucide-react';
import { useProfileStore } from '../../stores/useProfileStore';
import { useWaterStore } from '../../stores/useWaterStore';
import { WaterProgress } from '../common/WaterProgress';
import {
  formatAmount,
  formatTime,
  getHydrationStatus,
  getHydrationStatusLabel,
  getHydrationColor,
} from '../../utils/hydration';
import { PRESET_AMOUNTS } from '../../types';

export const Dashboard = () => {
  const profile = useProfileStore((s) => s.profile);
  const { todayEntries, todayTotal, addEntry, removeEntry, lastLogAnimation } =
    useWaterStore();
  const [customAmount, setCustomAmount] = useState(250);
  const [rippleKey, setRippleKey] = useState(0);

  if (!profile) return null;

  const { dailyGoal, unitSystem } = profile;
  const percentage = (todayTotal / dailyGoal) * 100;
  const remaining = Math.max(0, dailyGoal - todayTotal);
  const status = getHydrationStatus(todayTotal, dailyGoal);

  const handleQuickLog = async (amount: number) => {
    setRippleKey((k) => k + 1);
    await addEntry(amount);
  };

  const handleCustomLog = async () => {
    if (customAmount > 0) {
      setRippleKey((k) => k + 1);
      await addEntry(customAmount);
    }
  };

  const handleRemoveEntry = async (id: string) => {
    await removeEntry(id);
  };

  return (
    <div className="px-4 pb-24 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">
            Hi, {profile.name || 'there'}!
          </h1>
          <p className="text-sm text-hydro-text-muted">Stay hydrated today</p>
        </div>
        <div className={`text-sm font-medium px-3 py-1.5 rounded-full glass ${getHydrationColor(status)}`}>
          {getHydrationStatusLabel(status)}
        </div>
      </div>

      {/* Progress Circle */}
      <div className="flex flex-col items-center mb-6">
        <WaterProgress
          percentage={percentage}
          size={220}
          animationKey={lastLogAnimation}
        />
        <div className="flex items-center gap-6 mt-4">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{formatAmount(todayTotal, unitSystem)}</p>
            <p className="text-xs text-hydro-text-muted">Current</p>
          </div>
          <div className="w-px h-8 bg-hydro-border" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{formatAmount(dailyGoal, unitSystem)}</p>
            <p className="text-xs text-hydro-text-muted">Goal</p>
          </div>
          <div className="w-px h-8 bg-hydro-border" />
          <div className="text-center">
            <p className="text-lg font-bold text-hydro-accent">{formatAmount(remaining, unitSystem)}</p>
            <p className="text-xs text-hydro-text-muted">Remaining</p>
          </div>
        </div>
      </div>

      {/* Quick Log Buttons */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-hydro-text-muted mb-3 uppercase tracking-wide">Quick Add</h2>
        <div className="grid grid-cols-5 gap-2">
          {PRESET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickLog(amount)}
              tabIndex={0}
              aria-label={`Add ${formatAmount(amount, unitSystem)}`}
              className="relative overflow-hidden flex flex-col items-center gap-1 py-3 px-1 rounded-xl bg-hydro-card border border-hydro-border hover:border-hydro-accent/50 hover:bg-hydro-card-hover active:scale-95 transition-all duration-150 group"
            >
              <Droplets
                size={18}
                className="text-hydro-accent group-hover:scale-110 transition-transform"
              />
              <span className="text-xs font-semibold text-hydro-text">
                {formatAmount(amount, unitSystem)}
              </span>
              {rippleKey > 0 && (
                <span
                  key={`ripple-${amount}-${rippleKey}`}
                  className="absolute inset-0 bg-hydro-accent/20 rounded-xl animate-ripple pointer-events-none"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div className="glass-card p-4 mb-6">
        <h2 className="text-sm font-semibold text-hydro-text-muted mb-3 uppercase tracking-wide">Custom Amount</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCustomAmount((a) => Math.max(50, a - 50))}
            tabIndex={0}
            aria-label="Decrease amount"
            className="w-10 h-10 rounded-full bg-hydro-card border border-hydro-border flex items-center justify-center hover:bg-hydro-card-hover active:scale-95 transition-all"
          >
            <Minus size={16} className="text-hydro-text" />
          </button>
          <div className="flex-1 text-center">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(Math.max(0, Number(e.target.value)))}
              className="w-24 text-center text-xl font-bold bg-transparent text-white focus:outline-none"
              aria-label="Custom amount in milliliters"
            />
            <p className="text-xs text-hydro-text-muted">{unitSystem === 'imperial' ? 'oz' : 'ml'}</p>
          </div>
          <button
            onClick={() => setCustomAmount((a) => a + 50)}
            tabIndex={0}
            aria-label="Increase amount"
            className="w-10 h-10 rounded-full bg-hydro-card border border-hydro-border flex items-center justify-center hover:bg-hydro-card-hover active:scale-95 transition-all"
          >
            <Plus size={16} className="text-hydro-text" />
          </button>
          <button
            onClick={handleCustomLog}
            tabIndex={0}
            aria-label="Log custom amount"
            className="px-4 py-2.5 bg-hydro-accent text-white rounded-xl font-semibold hover:bg-hydro-accent/90 active:scale-95 transition-all shadow-lg shadow-hydro-accent/20"
          >
            Add
          </button>
        </div>
      </div>

      {/* Today's Log */}
      {todayEntries.length > 0 && (
        <div className="glass-card p-4">
          <h2 className="text-sm font-semibold text-hydro-text-muted mb-3 uppercase tracking-wide">
            Today&apos;s Log ({todayEntries.length} entries)
          </h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...todayEntries].reverse().map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-hydro-bg/50 animate-slide-up"
              >
                <div className="flex items-center gap-3">
                  <Droplets size={14} className="text-hydro-accent" />
                  <span className="text-sm font-medium text-hydro-text">
                    {formatAmount(entry.amount, unitSystem)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-hydro-text-muted">
                    {formatTime(entry.timestamp)}
                  </span>
                  <button
                    onClick={() => handleRemoveEntry(entry.id)}
                    tabIndex={0}
                    aria-label={`Remove ${formatAmount(entry.amount, unitSystem)} entry`}
                    className="text-hydro-text-muted hover:text-red-400 transition-colors p-1"
                  >
                    <Minus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
