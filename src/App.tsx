import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
import { useProfileStore } from './stores/useProfileStore';
import { RootLayout } from './layouts/RootLayout';
import { ProtectedLayout } from './layouts/ProtectedLayout';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { HistoryView } from './components/history/HistoryView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';

const CatchAll = () => {
  const { user } = useAuthStore();
  const profile = useProfileStore((s) => s.profile);

  if (!user) return <Navigate to="/login" replace />;
  if (!profile?.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/home" replace />;
};

const App = () => (
  <Routes>
    <Route element={<RootLayout />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Dashboard />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="/analytics" element={<AnalyticsView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Route>
      </Route>

      <Route path="*" element={<CatchAll />} />
    </Route>
  </Routes>
);

export default App;
