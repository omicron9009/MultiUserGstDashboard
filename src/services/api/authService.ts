import { request } from "./http";

export interface SessionStatusResponse {
  active_sessions?: unknown;
  active_count?: number;
  expiry?: { session_expiry?: string | null; token_expiry?: string | null } | null;
  last_refresh?: { last_refresh?: string | null } | null;
}

export const authService = {
  generateOtp: (username: string, gstin: string) =>
    request("/auth/generate-otp", {
      method: "POST",
      body: JSON.stringify({ username, gstin }),
    }),

  verifyOtp: (username: string, gstin: string, otp: string) =>
    request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ username, gstin, otp }),
    }),

  refreshSession: (gstin: string) =>
    request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ gstin }),
    }),

  getSession: (gstin: string) => request<SessionStatusResponse>(`/auth/session/${gstin}`),
};
