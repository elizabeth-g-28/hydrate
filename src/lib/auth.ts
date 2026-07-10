const ACCESS_TOKEN_KEY = "hydrate_access_token";
const REFRESH_TOKEN_KEY = "hydrate_refresh_token";

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const clearAccessToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const clearRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const clearAuth = (): void => {
  clearAccessToken();
  clearRefreshToken();
};

/** API-only app — enabled unless explicitly disabled. Empty VITE_API_URL uses Vite proxy. */
export const isApiEnabled = (): boolean => {
  const url = import.meta.env.VITE_API_URL;
  return url !== "false" && url !== "disabled";
};

/** Use '' for same-origin requests via Vite proxy in dev */
export const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_URL || "";
};

export const getGoogleClientId = (): string =>
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export const isGoogleAuthEnabled = (): boolean => Boolean(getGoogleClientId());
