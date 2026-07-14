import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login, register, logout, getMe, refreshAccessToken, loginWithGoogle } from '../lib/api';
import { isApiEnabled, clearAuth, getAccessToken, getRefreshToken } from '../lib/auth';
import { useProfileStore } from './useProfileStore';

const clearSession = () => {
  clearAuth();
  useProfileStore.getState().clearProfile();
};

interface AuthState {
  user: { id: string; email: string; name: string } | null;
  loading: boolean;
  sessionReady: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: (credential: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      sessionReady: false,
      error: null,

      signUp: async (email, password) => {
        if (!isApiEnabled()) {
          set({ error: 'Backend not configured. Set VITE_API_URL in .env' });
          return false;
        }

        set({ loading: true, error: null });
        try {
          await register(email, password);
          const { user } = await login(email, password);
          set({ user: { id: user.id, email: user.email, name: user.name }, loading: false });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Registration failed', loading: false });
          return false;
        }
      },

      signIn: async (email, password) => {
        if (!isApiEnabled()) {
          set({ error: 'Backend not configured. Set VITE_API_URL in .env' });
          return false;
        }

        set({ loading: true, error: null });
        try {
          const { user } = await login(email, password);
          set({ user: { id: user.id, email: user.email, name: user.name }, loading: false });
          return true;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Login failed', loading: false });
          return false;
        }
      },

      signInWithGoogle: async (credential) => {
        if (!isApiEnabled()) {
          set({ error: 'Backend not configured. Set VITE_API_URL in .env' });
          return false;
        }

        set({ loading: true, error: null });
        try {
          const { user } = await loginWithGoogle(credential);
          set({ user: { id: user.id, email: user.email, name: user.name }, loading: false });
          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Google sign-in failed',
            loading: false,
          });
          return false;
        }
      },

      signOut: async () => {
        set({ loading: true });
        try {
          if (isApiEnabled() && getAccessToken()) {
            await logout();
          }
        } finally {
          clearSession();
          set({ user: null, loading: false, error: null });
        }
      },

      checkSession: async () => {
        if (!isApiEnabled()) {
          clearSession();
          set({ user: null, loading: false, sessionReady: true });
          return;
        }

        set({ loading: true });

        if (!getAccessToken() && getRefreshToken()) {
          const refreshed = await refreshAccessToken();
          // Network blip with tokens still present — keep persisted user, retry later
          if (!refreshed && !getRefreshToken()) {
            clearSession();
            set({ user: null, loading: false, sessionReady: true });
            return;
          }
        }

        if (!getAccessToken() && !getRefreshToken()) {
          clearSession();
          set({ user: null, loading: false, sessionReady: true });
          return;
        }

        if (!getAccessToken()) {
          set({ loading: false, sessionReady: true });
          return;
        }

        try {
          const { user } = await getMe();
          set({ user: { id: user.id, email: user.email, name: user.name }, loading: false, sessionReady: true });
        } catch {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            try {
              const { user } = await getMe();
              set({ user: { id: user.id, email: user.email, name: user.name }, loading: false, sessionReady: true });
              return;
            } catch {
              // fall through
            }
          }

          // Auth truly invalid (refresh cleared tokens) vs transient API failure
          if (!getRefreshToken()) {
            clearSession();
            set({ user: null, loading: false, sessionReady: true });
            return;
          }

          set({ loading: false, sessionReady: true });
        }
      },
    }),
    {
      name: 'hydrate-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
