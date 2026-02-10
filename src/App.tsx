import { useState, useEffect } from 'react';
import { useProfileStore } from './stores/useProfileStore';
import { useReminders } from './hooks/useReminders';
import { Onboarding } from './components/onboarding/Onboarding';
import { Dashboard } from './components/dashboard/Dashboard';
import { HistoryView } from './components/history/HistoryView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { BottomNav } from './components/common/BottomNav';

type TabId = 'home' | 'history' | 'analytics' | 'settings';

const App = () => {
  const profile = useProfileStore((s) => s.profile);
  const [activeTab, setActiveTab] = useState<TabId>('home');

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (profile?.theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [profile?.theme]);

  // Initialize reminders
  useReminders();

  // Show onboarding if profile not set up
  if (!profile?.onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-hydro-bg">
      <main>
        {activeTab === 'home' && <Dashboard />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default App;
