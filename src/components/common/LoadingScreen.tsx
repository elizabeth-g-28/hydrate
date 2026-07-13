import { Loader } from 'lucide-react';

export const LoadingScreen = () => (
  <div
    className="flex min-h-screen flex-col items-center justify-center gap-3 bg-hydro-bg"
    role="status"
    aria-live="polite"
    aria-label="Loading"
  >
    <Loader size={32} className="animate-spin text-hydro-accent" aria-hidden="true" />
  </div>
);
