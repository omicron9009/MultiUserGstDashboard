const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function request<T = any>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────
export const authApi = {
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
  getSession: (gstin: string) =>
    request(`/auth/session/${gstin}`),
};

// ── Dashboard (read-only from DB) ─────────────────
export const dashboardApi = {
  getSummary: (gstin: string, year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (month) params.set("month", String(month));
    const qs = params.toString();
    return request(`/dashboard/summary/${gstin}${qs ? `?${qs}` : ""}`);
  },
  getLedger: (gstin: string) =>
    request(`/dashboard/ledger/${gstin}`),
  getReturns: (gstin: string, year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.set("year", String(year));
    if (month) params.set("month", String(month));
    const qs = params.toString();
    return request(`/dashboard/returns/${gstin}${qs ? `?${qs}` : ""}`);
  },
  getSession: (gstin: string) =>
    request(`/dashboard/session/${gstin}`),
};

// ── GSTR-1 (sandbox API via backend) ──────────────
export const gstr1Api = {
  getB2B: (gstin: string, year: string, month: string) =>
    request(`/gstr1/b2b/${gstin}/${year}/${month}`),
  getSummary: (gstin: string, year: string, month: string, type: "short" | "long" = "short") =>
    request(`/gstr1/summary/${gstin}/${year}/${month}?summary_type=${type}`),
  getB2CS: (gstin: string, year: string, month: string) =>
    request(`/gstr1/b2cs/${gstin}/${year}/${month}`),
  getHSN: (gstin: string, year: string, month: string) =>
    request(`/gstr1/hsn/${gstin}/${year}/${month}`),
  getCDNR: (gstin: string, year: string, month: string) =>
    request(`/gstr1/cdnr/${gstin}/${year}/${month}`),
  getNil: (gstin: string, year: string, month: string) =>
    request(`/gstr1/nil/${gstin}/${year}/${month}`),
  getDocIssue: (gstin: string, year: string, month: string) =>
    request(`/gstr1/doc-issue/${gstin}/${year}/${month}`),
  getExp: (gstin: string, year: string, month: string) =>
    request(`/gstr1/exp/${gstin}/${year}/${month}`),
};

// ── GSTR-2A ───────────────────────────────────────
export const gstr2aApi = {
  getB2B: (gstin: string, year: string, month: string) =>
    request(`/gstr2A/b2b/${gstin}/${year}/${month}`),
  getCDN: (gstin: string, year: string, month: string) =>
    request(`/gstr2A/cdn/${gstin}/${year}/${month}`),
};

// ── GSTR-2B ───────────────────────────────────────
export const gstr2bApi = {
  get: (gstin: string, year: string, month: string) =>
    request(`/gstr2B/gstr2b/${gstin}/${year}/${month}`),
};

// ── GSTR-3B ───────────────────────────────────────
export const gstr3bApi = {
  getDetails: (gstin: string, year: string, month: string) =>
    request(`/gstr3B/gstr3b/${gstin}/${year}/${month}`),
};

// ── GSTR-9 ────────────────────────────────────────
export const gstr9Api = {
  getDetails: (gstin: string, fy: string) =>
    request(`/gstr9/gstr9/${gstin}?financial_year=${fy}`),
  getAutoCalculated: (gstin: string, fy: string) =>
    request(`/gstr9/gstr9/${gstin}/auto-calculated?financial_year=${fy}`),
};

// ── Ledger ────────────────────────────────────────
export const ledgerApi = {
  getCashItcBalance: (gstin: string, year: string, month: string) =>
    request(`/ledgers/ledgers/${gstin}/${year}/${month}/balance`),
  getCashLedger: (gstin: string, from: string, to: string) =>
    request(`/ledgers/ledgers/${gstin}/cash?from=${from}&to=${to}`),
  getItcLedger: (gstin: string, from: string, to: string) =>
    request(`/ledgers/ledgers/${gstin}/itc?from=${from}&to=${to}`),
};

// ── Return Status ─────────────────────────────────
export const returnStatusApi = {
  getStatus: (gstin: string, year: string, month: string, referenceId: string) =>
    request(`/return_status/returns/${gstin}/${year}/${month}/status?reference_id=${referenceId}`),
};
