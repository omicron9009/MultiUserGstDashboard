import { buildUrl, request } from "./http";

export interface DashboardSummaryResponse {
  summary: {
    gstin: string;
    gstr1: Record<string, number>;
    gstr2a_itc: Record<string, number>;
    gstr3b_liability: Record<string, number>;
    monthly_tax_trend?: Array<{
      year: number | null;
      month: number | null;
      total_igst: number;
      total_cgst: number;
      total_sgst: number;
    }>;
  };
  filing_status: Array<Record<string, unknown>>;
}

export interface DashboardLedgerResponse {
  cash_ledger?: { transaction_count?: number; total_amount?: number; min_amount?: number | null; max_amount?: number | null };
  itc_ledger?: { transaction_count?: number; total_amount?: number };
  liability_ledger?: { transaction_count?: number; total_amount?: number };
  balances?: Array<{ snapshot_type: string; tax_head: string | null; component: string | null; amount: number }>;
  monthly_totals?: Array<{ from_date: string | null; transaction_count: number; total_amount: number }>;
}

export interface DashboardSessionResponse {
  active_sessions?: Array<Record<string, unknown>>;
  active_count?: number;
  expiry?: { session_expiry?: string | null; token_expiry?: string | null } | null;
  last_refresh?: { last_refresh?: string | null } | null;
}

export interface DashboardClientsResponse {
  clients: Array<{
    client_id: number;
    gstin: string;
    legal_name: string | null;
    username?: string | null;
    active: boolean;
    session_expiry?: string | null;
    token_expiry?: string | null;
    last_refresh?: string | null;
  }>;
  total: number;
}

export const dashboardService = {
  getSummary: (gstin: string, year?: number, month?: number) =>
    request<DashboardSummaryResponse>(buildUrl(`/dashboard/summary/${gstin}`, { year, month })),

  getLedger: (gstin: string) => request<DashboardLedgerResponse>(`/dashboard/ledger/${gstin}`),

  getReturns: (gstin: string, year?: number, month?: number) =>
    request(buildUrl(`/dashboard/returns/${gstin}`, { year, month })),

  getSession: (gstin: string) => request<DashboardSessionResponse>(`/dashboard/session/${gstin}`),

  getClients: () => request<DashboardClientsResponse>(`/dashboard/clients`),
};
