import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, User, Activity, Bell, ChevronRight, ChevronLeft } from 'lucide-react';
import { useProfileStore, createDefaultProfile } from '../../stores/useProfileStore';
import { useReminderStore } from '../../stores/useReminderStore';
import { calculateDailyGoal, formatAmount } from '../../utils/hydration';
import { subscribeToPush } from '../../utils/notifications';
import type { Gender, ActivityLevel, UserProfile } from '../../types';
import { ACTIVITY_OPTIONS, ACTIVITY_MULTIPLIERS } from '../../types';

const STEPS = ['welcome', 'profile', 'activity', 'notifications'] as const;
type Step = (typeof STEPS)[number];

export const Onboarding = () => {
  const navigate = useNavigate();
  const setProfile = useProfileStore((s) => s.setProfile);
  const updateSettings = useReminderStore((s) => s.updateSettings);
  const [step, setStep] = useState<Step>('welcome');
  const [draft, setDraft] = useState<Partial<UserProfile>>(createDefaultProfile());

  const currentIndex = STEPS.indexOf(step);

  const handleNext = () => {
    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    const subscribed = await subscribeToPush();
    if (subscribed) {
      updateSettings({ enabled: true, fixedInterval: true });
    }
    const goal = calculateDailyGoal(
      draft.weight ?? 70,
      draft.activityLevel ?? 'moderate'
    );
    const profile: UserProfile = {
      ...(createDefaultProfile()),
      ...draft,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      dailyGoal: goal,
      onboardingComplete: true,
    };
    setProfile(profile);
    navigate('/home', { replace: true });
  };

  const updateDraft = (updates: Partial<UserProfile>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-hydro-bg">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemax={STEPS.length}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              i <= currentIndex ? 'w-8 bg-hydro-accent' : 'w-2 bg-hydro-border'
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-md animate-slide-up">
        {step === 'welcome' && <WelcomeStep />}
        {step === 'profile' && <ProfileStep draft={draft} onUpdate={updateDraft} />}
        {step === 'activity' && <ActivityStep draft={draft} onUpdate={updateDraft} />}
        {step === 'notifications' && <NotificationStep draft={draft} />}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 mt-8 w-full max-w-md">
        {currentIndex > 0 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 px-4 py-3 rounded-xl text-hydro-text-muted hover:text-hydro-text transition-colors"
            aria-label="Go back"
            tabIndex={0}
          >
            <ChevronLeft size={18} />
            Back
          </button>
        )}
        <div className="flex-1" />
        {currentIndex < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-6 py-3 bg-hydro-accent text-white rounded-xl font-semibold hover:bg-hydro-accent/90 transition-colors shadow-lg shadow-hydro-accent/20"
            aria-label="Continue"
            tabIndex={0}
          >
            Continue
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="flex items-center gap-1 px-6 py-3 bg-hydro-accent text-white rounded-xl font-semibold hover:bg-hydro-accent/90 transition-colors shadow-lg shadow-hydro-accent/20"
            aria-label="Get started"
            tabIndex={0}
          >
            Get Started
            <Droplets size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

const WelcomeStep = () => (
  <div className="text-center">
    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-hydro-accent/10 flex items-center justify-center animate-bounce-in">
      <Droplets size={48} className="text-hydro-accent" />
    </div>
    <h1 className="text-3xl font-bold text-white mb-3">Welcome to Hydrate</h1>
    <p className="text-hydro-text-muted text-lg leading-relaxed">
      Your personal hydration companion. Track water intake, set goals, and build healthy habits.
    </p>
  </div>
);

interface StepProps {
  draft: Partial<UserProfile>;
  onUpdate: (updates: Partial<UserProfile>) => void;
}

const ProfileStep = ({ draft, onUpdate }: StepProps) => {
  const [weightText, setWeightText] = useState(
    draft.weight != null ? String(draft.weight) : '70'
  );

  const handleWeightChange = (raw: string) => {
    setWeightText(raw);
    if (raw.trim() === '') return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    onUpdate({ weight: parsed });
  };

  const handleWeightBlur = () => {
    const parsed = Number(weightText);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      const fallback = draft.weight ?? 70;
      setWeightText(String(fallback));
      onUpdate({ weight: fallback });
      return;
    }
    setWeightText(String(parsed));
    onUpdate({ weight: parsed });
  };

  return (
  <div>
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-full bg-hydro-accent/10 flex items-center justify-center">
        <User size={20} className="text-hydro-accent" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">About You</h2>
        <p className="text-sm text-hydro-text-muted">We'll personalize your water goal</p>
      </div>
    </div>

    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-hydro-text-muted mb-1.5">Name</label>
        <input
          id="name"
          type="text"
          value={draft.name ?? ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Your name"
          className="w-full px-4 py-3 rounded-xl bg-hydro-card border border-hydro-border text-hydro-text placeholder:text-hydro-text-muted/50 focus:outline-none focus:ring-2 focus:ring-hydro-accent/50 transition-shadow"
        />
      </div>

      <div>
        <label htmlFor="weight" className="block text-sm font-medium text-hydro-text-muted mb-1.5">Weight (kg)</label>
        <input
          id="weight"
          type="number"
          value={weightText}
          onChange={(e) => handleWeightChange(e.target.value)}
          onBlur={handleWeightBlur}
          min={20}
          max={300}
          className="w-full px-4 py-3 rounded-xl bg-hydro-card border border-hydro-border text-hydro-text focus:outline-none focus:ring-2 focus:ring-hydro-accent/50 transition-shadow"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-hydro-text-muted mb-2">Gender</label>
        <div className="grid grid-cols-3 gap-2">
          {(['male', 'female', 'other'] as Gender[]).map((g) => (
            <button
              key={g}
              onClick={() => onUpdate({ gender: g })}
              tabIndex={0}
              aria-pressed={draft.gender === g}
              className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                draft.gender === g
                  ? 'bg-hydro-accent/15 border-hydro-accent text-hydro-accent'
                  : 'bg-hydro-card border-hydro-border text-hydro-text-muted hover:border-hydro-accent/50'
              }`}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
  );
};

const ActivityStep = ({ draft, onUpdate }: StepProps) => {
  const weight = draft.weight ?? 70;
  const activity = draft.activityLevel ?? 'moderate';
  const goal = calculateDailyGoal(weight, activity);
  const baseIntake = Math.round(weight * 32.5);
  const activityBonus = ACTIVITY_MULTIPLIERS[activity];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-hydro-accent/10 flex items-center justify-center">
          <Activity size={20} className="text-hydro-accent" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Your Daily Routine</h2>
          <p className="text-sm text-hydro-text-muted">Pick what best describes a typical day</p>
        </div>
      </div>

      <div className="space-y-2">
        {(Object.entries(ACTIVITY_OPTIONS) as [ActivityLevel, typeof ACTIVITY_OPTIONS[ActivityLevel]][]).map(
          ([key, option]) => (
            <button
              key={key}
              onClick={() => onUpdate({ activityLevel: key })}
              tabIndex={0}
              aria-pressed={draft.activityLevel === key}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                draft.activityLevel === key
                  ? 'bg-hydro-accent/15 border-hydro-accent'
                  : 'bg-hydro-card border-hydro-border hover:border-hydro-accent/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-medium ${draft.activityLevel === key ? 'text-hydro-accent' : 'text-hydro-text'}`}
                >
                  {option.label}
                </span>
                <span className="text-xs text-hydro-text-muted">{option.extraMl}</span>
              </div>
              <p className="text-xs text-hydro-text-muted mt-0.5">{option.description}</p>
            </button>
          )
        )}
      </div>

      {/* Goal breakdown */}
      <div className="mt-6 p-4 rounded-xl bg-hydro-accent/10 border border-hydro-accent/20 space-y-2">
        <p className="text-xs font-semibold text-hydro-text-muted uppercase tracking-wide">How we calculate your goal</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-hydro-text-muted">Base ({weight}kg x 32.5ml)</span>
          <span className="font-medium text-hydro-text">{formatAmount(baseIntake, 'metric')}</span>
        </div>
        {activityBonus > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-hydro-text-muted">Activity bonus</span>
            <span className="font-medium text-hydro-text">+{formatAmount(activityBonus, 'metric')}</span>
          </div>
        )}
        <div className="border-t border-hydro-border/50 pt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-hydro-text">Recommended daily goal</span>
          <span className="text-xl font-bold text-hydro-accent">{formatAmount(goal, 'metric')}</span>
        </div>
      </div>
    </div>
  );
};

const NotificationStep = ({ draft }: { draft: Partial<UserProfile> }) => {
  const goal = calculateDailyGoal(draft.weight ?? 70, draft.activityLevel ?? 'moderate');

  return (
    <div className="text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-hydro-accent/10 flex items-center justify-center animate-bounce-in">
        <Bell size={36} className="text-hydro-accent" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Stay on Track</h2>
      <p className="text-hydro-text-muted mb-6 leading-relaxed">
        Enable notifications to get gentle reminders throughout the day to drink water.
      </p>

      <div className="glass-card p-5 text-left space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-hydro-text-muted">Daily Goal</span>
          <span className="font-semibold text-hydro-accent">{formatAmount(goal, 'metric')}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-hydro-text-muted">Reminders</span>
          <span className="font-semibold text-emerald-400">Every hour</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-hydro-text-muted">Quick Log</span>
          <span className="font-semibold text-emerald-400">1-tap logging</span>
        </div>
      </div>
    </div>
  );
};
