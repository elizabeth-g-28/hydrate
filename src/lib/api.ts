import type { UserProfile, WaterEntry, ReminderSettings } from "../types";
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearAuth,
  getApiBaseUrl,
} from "./auth";

const API_URL = getApiBaseUrl();

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type ApiError = { error: string };

const storeTokens = (accessToken: string, refreshToken: string) => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

/** Coalesce concurrent identical GET requests (React StrictMode runs effects twice in dev) */
const inFlightGets = new Map<string, Promise<unknown>>();

const apiFetchInner = async <T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> => {
  const token = getAccessToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const isAuthRoute =
    path.includes("/auth/refresh") ||
    path.includes("/auth/login") ||
    path.includes("/auth/register") ||
    path.includes("/auth/google");

  if (response.status === 401 && retry && !isAuthRoute) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiFetchInner<T>(path, options, false);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as ApiError).error || "Request failed");
  }

  return data as T;
};

const apiFetch = async <T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> => {
  const method = options.method ?? "GET";
  if (method === "GET" && retry) {
    const existing = inFlightGets.get(path);
    if (existing) return existing as Promise<T>;

    const promise = apiFetchInner<T>(path, options, retry).finally(() => {
      inFlightGets.delete(path);
    });
    inFlightGets.set(path, promise);
    return promise;
  }

  return apiFetchInner<T>(path, options, retry);
};

/** Coalesce concurrent refreshes so parallel 401s share one request */
let refreshInFlight: Promise<boolean> | null = null;

export const refreshAccessToken = async (): Promise<boolean> => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuth();
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      // Only clear on auth failure — not on network blips
      if (response.status === 401 || response.status === 403) {
        clearAuth();
        return false;
      }

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as { accessToken: string; refreshToken?: string };
      setAccessToken(data.accessToken);
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }
      return true;
    } catch {
      // Offline / CORS / transient — keep tokens so session can recover
      return false;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
};

export const register = (email: string, password: string) =>
  apiFetch<{ user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as ApiError).error || "Login failed");
  }

  const { accessToken, refreshToken, user } = data as AuthResponse;
  storeTokens(accessToken, refreshToken);
  return { accessToken, refreshToken, user };
};

export const loginWithGoogle = async (credential: string) => {
  const response = await fetch(`${API_URL}/api/auth/google`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as ApiError).error || "Google sign-in failed");
  }

  const { accessToken, refreshToken, user } = data as AuthResponse;
  storeTokens(accessToken, refreshToken);
  return { accessToken, refreshToken, user };
};

export const logout = async () => {
  try {
    if (getAccessToken()) {
      await apiFetch("/api/auth/logout", { method: "POST" });
    }
  } finally {
    clearAuth();
  }
};

export const getMe = () => apiFetch<{ user: AuthUser }>("/api/auth/me");

export const getProfile = () => apiFetch<{ profile: UserProfile }>("/api/profile");

export const updateProfile = (profile: Partial<UserProfile>) =>
  apiFetch<{ profile: UserProfile }>("/api/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });

export const getWaterEntries = (params: { date?: string; from?: string; to?: string }) => {
  const search = new URLSearchParams();
  if (params.date) search.set("date", params.date);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  const query = search.toString();
  return apiFetch<{ entries: WaterEntry[] }>(`/api/water-entries${query ? `?${query}` : ""}`);
};

export const getWaterSummaries = (days = 365) =>
  apiFetch<{ summaries: { date: string; totalIntake: number }[] }>(
    `/api/water-entries/summaries?days=${days}`
  );

export const addWaterEntry = (entry: Omit<WaterEntry, "id">) =>
  apiFetch<{ entry: WaterEntry }>("/api/water-entries", {
    method: "POST",
    body: JSON.stringify(entry),
  });

export const deleteWaterEntry = (id: string) =>
  apiFetch<{ message: string }>(`/api/water-entries/${id}`, { method: "DELETE" });

export const getReminders = () =>
  apiFetch<{ settings: ReminderSettings }>("/api/reminders");

export const updateReminders = (settings: Partial<ReminderSettings>) =>
  apiFetch<{ settings: ReminderSettings }>("/api/reminders", {
    method: "PUT",
    body: JSON.stringify(settings),
  });

let cachedVapidPublicKey: string | null = null;

export const getVapidPublicKey = async () => {
  if (cachedVapidPublicKey) {
    return { publicKey: cachedVapidPublicKey };
  }
  const { publicKey } = await apiFetch<{ publicKey: string }>("/api/push/vapid-public-key");
  cachedVapidPublicKey = publicKey;
  return { publicKey };
};

export const savePushSubscription = (subscription: PushSubscriptionJSON) =>
  apiFetch<{ message: string }>("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
  });

export const removePushSubscription = (endpoint: string) =>
  apiFetch<{ message: string }>("/api/push/unsubscribe", {
    method: "DELETE",
    body: JSON.stringify({ endpoint }),
  });

export const hydrateFromApi = (() => {
  let inFlight: Promise<void> | null = null;

  return async () => {
    if (inFlight) return inFlight;

    inFlight = (async () => {
      const { useProfileStore } = await import("../stores/useProfileStore");
      const { useReminderStore } = await import("../stores/useReminderStore");
      const { useWaterStore } = await import("../stores/useWaterStore");

      try {
        const { profile } = await getProfile();
        useProfileStore.getState().setProfileLocal(profile);
      } catch {
        // Profile may not exist yet before onboarding
      }

      try {
        const { settings } = await getReminders();
        useReminderStore.getState().setSettingsLocal(settings);
      } catch {
        // Use defaults
      }

      await useWaterStore.getState().loadTodayData();
    })().finally(() => {
      inFlight = null;
    });

    return inFlight;
  };
})();
