import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  User,
  Bell,
  BellOff,
  Palette,
  Ruler,
  Target,
  Moon,
  Sun,
  Clock,
  Activity,
  LogOut,
} from 'lucide-react';
import { useProfileStore } from '../../stores/useProfileStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useReminderStore } from '../../stores/useReminderStore';
import { calculateDailyGoal, formatAmount } from '../../utils/hydration';
import { subscribeToPush, hasPushSubscription, isNotificationSupported } from '../../utils/notifications';
import { isApiEnabled } from '../../lib/auth';
import type { ActivityLevel, Gender, UnitSystem, Theme } from '../../types';
import { ACTIVITY_OPTIONS } from '../../types';

export const SettingsView = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfileStore();
  const { settings, updateSettings } = useReminderStore();
  const { signOut } = useAuthStore();

  if (!profile) return null;

  const apiEnabled = isApiEnabled();
  const notificationsAvailable = isNotificationSupported();

  const handleNotificationsToggle = async (on: boolean) => {
    if (on) {
      const hasSub = await hasPushSubscription();
      if (!hasSub) {
        const ok = await subscribeToPush();
        if (!ok) return;
      }
      updateSettings({ enabled: true, fixedInterval: true });
      return;
    }
    updateSettings({ enabled: false });
  };

  const handleRecalculateGoal = () => {
    const newGoal = calculateDailyGoal(profile.weight, profile.activityLevel);
    updateProfile({ dailyGoal: newGoal, manualGoalOverride: false });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="px-4 pb-24 pt-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-white mb-6">Settings</h1>

      {/* Profile Section */}
      <SettingsSection icon={User} title="Profile">
        <SettingsInput
          label="Name"
          value={profile.name}
          onChange={(v) => updateProfile({ name: v })}
        />
        <WeightInput
          key={profile.id}
          initialWeight={profile.weight}
          onCommit={(weight) => updateProfile({ weight })}
        />
        <div>
          <label className="block text-xs text-hydro-text-muted mb-1.5 font-medium">Gender</label>
          <div className="grid grid-cols-3 gap-2">
            {(['male', 'female', 'other'] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => updateProfile({ gender: g })}
                tabIndex={0}
                aria-pressed={profile.gender === g}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                  profile.gender === g
                    ? 'bg-hydro-accent/15 border-hydro-accent text-hydro-accent'
                    : 'bg-hydro-bg border-hydro-border text-hydro-text-muted hover:border-hydro-accent/50'
                }`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Activity Level */}
      <SettingsSection icon={Activity} title="Activity Level">
        <div className="space-y-1.5">
          {(Object.entries(ACTIVITY_OPTIONS) as [ActivityLevel, typeof ACTIVITY_OPTIONS[ActivityLevel]][]).map(
            ([key, option]) => (
              <button
                key={key}
                onClick={() => updateProfile({ activityLevel: key })}
                tabIndex={0}
                aria-pressed={profile.activityLevel === key}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                  profile.activityLevel === key
                    ? 'bg-hydro-accent/15 border-hydro-accent'
                    : 'bg-hydro-bg border-hydro-border hover:border-hydro-accent/50'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    profile.activityLevel === key ? 'text-hydro-accent' : 'text-hydro-text'
                  }`}
                >
                  {option.label}
                </span>
                <p className="text-[11px] text-hydro-text-muted mt-0.5">{option.description}</p>
              </button>
            )
          )}
        </div>
      </SettingsSection>

      {/* Goal */}
      <SettingsSection icon={Target} title="Daily Goal">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-hydro-text-muted">Current Goal</span>
          <span className="text-lg font-bold text-hydro-accent">
            {formatAmount(profile.dailyGoal, profile.unitSystem)}
          </span>
        </div>
        <div>
          <label htmlFor="goal-slider" className="block text-xs text-hydro-text-muted mb-2">
            Manual Override
          </label>
          <input
            id="goal-slider"
            type="range"
            min={500}
            max={6000}
            step={50}
            value={profile.dailyGoal}
            onChange={(e) => updateProfile({ dailyGoal: Number(e.target.value), manualGoalOverride: true })}
            className="w-full h-2 bg-hydro-border rounded-lg appearance-none cursor-pointer accent-hydro-accent"
          />
          <div className="flex justify-between text-[10px] text-hydro-text-muted mt-1">
            <span>500ml</span>
            <span>6000ml</span>
          </div>
        </div>
        {profile.manualGoalOverride && (
          <button
            onClick={handleRecalculateGoal}
            tabIndex={0}
            className="mt-2 text-xs text-hydro-accent hover:underline"
          >
            Reset to calculated goal
          </button>
        )}
      </SettingsSection>

      {/* Schedule */}
      <SettingsSection icon={Clock} title="Schedule">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="wake-time" className="block text-xs text-hydro-text-muted mb-1.5 font-medium">Wake Time</label>
            <input
              id="wake-time"
              type="time"
              value={profile.wakeTime}
              onChange={(e) => updateProfile({ wakeTime: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-hydro-bg border border-hydro-border text-hydro-text text-sm focus:outline-none focus:ring-2 focus:ring-hydro-accent/50"
            />
          </div>
          <div>
            <label htmlFor="sleep-time" className="block text-xs text-hydro-text-muted mb-1.5 font-medium">Sleep Time</label>
            <input
              id="sleep-time"
              type="time"
              value={profile.sleepTime}
              onChange={(e) => updateProfile({ sleepTime: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-hydro-bg border border-hydro-border text-hydro-text text-sm focus:outline-none focus:ring-2 focus:ring-hydro-accent/50"
            />
          </div>
        </div>
      </SettingsSection>

      {/* Reminders */}
      <SettingsSection icon={Bell} title="Reminders">
        <div className={`grid grid-cols-2 gap-2 ${!notificationsAvailable ? 'opacity-50 pointer-events-none' : ''}`}>
          <button
            type="button"
            onClick={() => handleNotificationsToggle(true)}
            tabIndex={0}
            aria-pressed={settings.enabled}
            aria-label="Enable reminders"
            disabled={!notificationsAvailable}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              settings.enabled
                ? 'bg-hydro-accent/15 border-hydro-accent text-hydro-accent'
                : 'bg-hydro-bg border-hydro-border text-hydro-text-muted hover:border-hydro-accent/50'
            }`}
          >
            <Bell size={14} />
            Enable
          </button>
          <button
            type="button"
            onClick={() => handleNotificationsToggle(false)}
            tabIndex={0}
            aria-pressed={!settings.enabled}
            aria-label="Disable reminders"
            disabled={!notificationsAvailable}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              !settings.enabled
                ? 'bg-hydro-accent/15 border-hydro-accent text-hydro-accent'
                : 'bg-hydro-bg border-hydro-border text-hydro-text-muted hover:border-hydro-accent/50'
            }`}
          >
            <BellOff size={14} />
            Disable
          </button>
        </div>
        {settings.enabled && (
          <div className="mt-3 space-y-1 border-l-2 border-hydro-border pl-4">
            <ToggleRow
              label="Hourly Reminders"
              enabled={settings.fixedInterval}
              onChange={(v) => updateSettings({ fixedInterval: v })}
            />
            <ToggleRow
              label="Morning Boost"
              enabled={settings.morningBoost}
              onChange={(v) => updateSettings({ morningBoost: v })}
            />
            <ToggleRow
              label="Evening Wind-down"
              enabled={settings.eveningWinddown}
              onChange={(v) => updateSettings({ eveningWinddown: v })}
            />
            <ToggleRow
              label="Do Not Disturb"
              enabled={settings.dndEnabled}
              onChange={(v) => updateSettings({ dndEnabled: v })}
            />
            {settings.dndEnabled && (
              <div className="grid grid-cols-2 gap-3 mt-2 pl-1">
                <div>
                  <label htmlFor="dnd-start" className="block text-xs text-hydro-text-muted mb-1">From</label>
                  <input
                    id="dnd-start"
                    type="time"
                    value={settings.dndStart}
                    onChange={(e) => updateSettings({ dndStart: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-hydro-bg border border-hydro-border text-hydro-text text-sm focus:outline-none focus:ring-2 focus:ring-hydro-accent/50"
                  />
                </div>
                <div>
                  <label htmlFor="dnd-end" className="block text-xs text-hydro-text-muted mb-1">To</label>
                  <input
                    id="dnd-end"
                    type="time"
                    value={settings.dndEnd}
                    onChange={(e) => updateSettings({ dndEnd: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-hydro-bg border border-hydro-border text-hydro-text text-sm focus:outline-none focus:ring-2 focus:ring-hydro-accent/50"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection icon={Palette} title="Appearance">
        <div>
          <label className="block text-xs text-hydro-text-muted mb-2 font-medium">Theme</label>
          <div className="grid grid-cols-2 gap-2">
            {(['dark', 'light'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => updateProfile({ theme: t })}
                tabIndex={0}
                aria-pressed={profile.theme === t}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  profile.theme === t
                    ? 'bg-hydro-accent/15 border-hydro-accent text-hydro-accent'
                    : 'bg-hydro-bg border-hydro-border text-hydro-text-muted hover:border-hydro-accent/50'
                }`}
              >
                {t === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Units */}
      <SettingsSection icon={Ruler} title="Units">
        <div className="grid grid-cols-2 gap-2">
          {(['metric', 'imperial'] as UnitSystem[]).map((u) => (
            <button
              key={u}
              onClick={() => updateProfile({ unitSystem: u })}
              tabIndex={0}
              aria-pressed={profile.unitSystem === u}
              className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                profile.unitSystem === u
                  ? 'bg-hydro-accent/15 border-hydro-accent text-hydro-accent'
                  : 'bg-hydro-bg border-hydro-border text-hydro-text-muted hover:border-hydro-accent/50'
              }`}
            >
              {u === 'metric' ? 'Metric (ml)' : 'Imperial (oz)'}
            </button>
          ))}
        </div>
      </SettingsSection>

      {apiEnabled && (
        <button
          type="button"
          onClick={handleSignOut}
          tabIndex={0}
          aria-label="Sign out"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-hydro-card border border-hydro-border text-hydro-text-muted hover:text-hydro-text hover:border-hydro-accent/50 transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      )}
    </div>
  );
};

/* Sub-components */

interface SettingsSectionProps {
  icon: typeof User;
  title: string;
  children: React.ReactNode;
}

const SettingsSection = ({ icon: Icon, title, children }: SettingsSectionProps) => (
  <div className="glass-card p-4 mb-4">
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} className="text-hydro-accent" />
      <h2 className="text-sm font-semibold text-white uppercase tracking-wide">{title}</h2>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

interface WeightInputProps {
  initialWeight: number;
  onCommit: (weight: number) => void;
}

const WeightInput = ({ initialWeight, onCommit }: WeightInputProps) => {
  const [weightText, setWeightText] = useState(String(initialWeight));

  const handleWeightBlur = () => {
    const parsed = Number(weightText);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setWeightText(String(initialWeight));
      return;
    }
    setWeightText(String(parsed));
    onCommit(parsed);
  };

  return (
    <SettingsInput
      label="Weight (kg)"
      type="number"
      value={weightText}
      onChange={setWeightText}
      onBlur={handleWeightBlur}
    />
  );
};

interface SettingsInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
}

const SettingsInput = ({ label, value, onChange, onBlur, type = 'text' }: SettingsInputProps) => (
  <div>
    <label className="block text-xs text-hydro-text-muted mb-1.5 font-medium">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className="w-full px-3 py-2 rounded-lg bg-hydro-bg border border-hydro-border text-hydro-text text-sm focus:outline-none focus:ring-2 focus:ring-hydro-accent/50 transition-shadow"
    />
  </div>
);

interface ToggleRowProps {
  label: string;
  enabled: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

const ToggleRow = ({ label, enabled, disabled = false, onChange }: ToggleRowProps) => (
  <div className={`flex items-center justify-between py-1 ${disabled ? 'opacity-50' : ''}`}>
    <span className="text-sm text-hydro-text">{label}</span>
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      tabIndex={disabled ? -1 : 0}
      role="switch"
      aria-checked={enabled}
      aria-disabled={disabled}
      aria-label={`Toggle ${label}`}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        enabled ? 'bg-hydro-accent' : 'bg-hydro-border'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);
