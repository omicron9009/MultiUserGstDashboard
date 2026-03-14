import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { SectionPanel } from "@/components/SectionPanel";
import { DataTable } from "@/components/DataTable";
import { TaxBarChart, StatusPieChart } from "@/components/Charts";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { FetchDataModal } from "@/components/FetchDataModal";
import { useApiQuery } from "@/hooks/useApiQuery";
import { dashboardService, authService } from "@/services/api";
import type { DashboardSessionResponse } from "@/services/api/dashboardService";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { generateDashboardReport } from "@/utils/reportGenerator";
import {
  ArrowLeft, RefreshCw, Download, IndianRupee,
  Receipt, Wallet, AlertTriangle, Clock, Database, FileText,
} from "lucide-react";
import { toast } from "sonner";

export default function ClientDashboard() {
  const { gstin } = useParams<{ gstin: string }>();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [fetchModalOpen, setFetchModalOpen] = useState(false);

  const summary = useApiQuery(
    () => dashboardService.getSummary(gstin!),
    [gstin]
  );
  const ledger = useApiQuery(
    () => dashboardService.getLedger(gstin!),
    [gstin]
  );
  const returns = useApiQuery(
    () => dashboardService.getReturns(gstin!),
    [gstin]
  );
  const session = useApiQuery(
    () => dashboardService.getSession(gstin!),
    [gstin]
  );

  const sessionData = session.data as DashboardSessionResponse | null;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await authService.refreshSession(gstin!);
      toast.success("Session refreshed");
      session.refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenerateReport = () => {
    const activeSessions = Array.isArray(sessionData?.active_sessions) ? sessionData!.active_sessions : [];
    const activeCount = sessionData?.active_count ?? activeSessions.length;
    generateDashboardReport({
      gstin: gstin!,
      sessionActive: activeCount > 0,
      summary: summary.data,
      ledger: ledger.data,
      returns: returns.data,
    });
    toast.success("Report downloaded");
  };

  const handleFetchComplete = () => {
    summary.refetch();
    ledger.refetch();
    returns.refetch();
  };

  // Derive metrics from summary data
  const gstr1 = summary.data?.summary?.gstr1;
  const gstr2a = summary.data?.summary?.gstr2a_itc;
  const gstr3b = summary.data?.summary?.gstr3b_liability;
  const filingStatus = summary.data?.filing_status || [];

  const taxBreakdown = gstr3b
    ? [
        { name: "IGST", value: gstr3b.total_igst },
        { name: "CGST", value: gstr3b.total_cgst },
        { name: "SGST", value: gstr3b.total_sgst },
      ]
    : [];

  const monthlyTrend = (summary.data?.summary?.monthly_tax_trend || []).map((entry: any) => ({
    month: entry.month ? getMonthName(Number(entry.month)) : "—",
    igst: entry.total_igst ?? 0,
    cgst: entry.total_cgst ?? 0,
    sgst: entry.total_sgst ?? 0,
  }));

  const activeSessions = Array.isArray(sessionData?.active_sessions) ? sessionData!.active_sessions : [];
  const activeCount = sessionData?.active_count ?? activeSessions.length;
  const sessionExpiry = sessionData?.expiry?.session_expiry ?? null;
  const lastRefresh = sessionData?.last_refresh?.last_refresh ?? null;

  const balances = ledger.data?.balances || [];
  const sumBalance = (type: string) =>
    balances
      .filter((entry: any) => entry.snapshot_type === type)
      .reduce((total: number, entry: any) => total + (entry.amount || 0), 0);
  const cashBalance = sumBalance("cash");
  const itcBalance = sumBalance("itc");
  const transactionCount =
    (ledger.data?.cash_ledger?.transaction_count || 0) +
    (ledger.data?.itc_ledger?.transaction_count || 0) +
    (ledger.data?.liability_ledger?.transaction_count || 0);

  const totalLiability = gstr3b
    ? gstr3b.total_igst + gstr3b.total_cgst + gstr3b.total_sgst
    : 0;
  const totalItc = gstr2a
    ? gstr2a.total_igst + gstr2a.total_cgst + gstr2a.total_sgst
    : 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/clients")}
            className="p-2 rounded-md hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground tracking-tight font-mono">
                {gstin}
              </h1>
              {sessionData && (
                <StatusBadge
                  status={activeCount > 0 ? "active" : "expired"}
                  label={activeCount > 0 ? "Session Active" : "Session Expired"}
                />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Client Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFetchModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            Fetch Data
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Report
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Total Tax Liability"
          value={summary.loading ? "—" : formatCurrency(totalLiability)}
          icon={IndianRupee}
          subValue={gstr3b ? `${gstr1?.invoice_count || 0} invoices` : undefined}
        />
        <MetricCard
          label="ITC Available"
          value={summary.loading ? "—" : formatCurrency(totalItc)}
          icon={Receipt}
          trend="up"
          subValue={gstr2a ? `${gstr2a.invoice_count} claims` : undefined}
        />
        <MetricCard
          label="Net Payable"
          value={summary.loading ? "—" : formatCurrency(Math.max(0, totalLiability - totalItc))}
          icon={Wallet}
        />
        <MetricCard
          label="Pending Filings"
          value={String(filingStatus.filter((f: any) => f.status_cd !== "Filed").length)}
          icon={AlertTriangle}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Tax Liability</h3>
          <TaxBarChart data={monthlyTrend} />
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Tax Composition</h3>
          <StatusPieChart data={taxBreakdown.length ? taxBreakdown : [{ name: "No data", value: 1 }]} />
        </div>
      </div>

      {/* GSTR Sections */}
      <div className="space-y-4 mb-8">
        <SectionPanel title="GSTR-1 — Sales Summary" subtitle="Outward supplies" defaultOpen>
          {summary.loading ? (
            <LoadingState />
          ) : summary.error ? (
            <ErrorState message={summary.error} onRetry={summary.refetch} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div>
                <p className="metric-label">Invoices</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">{gstr1?.invoice_count || 0}</p>
              </div>
              <div>
                <p className="metric-label">Taxable Value</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">{formatCurrency(gstr1?.total_taxable || 0)}</p>
              </div>
              <div>
                <p className="metric-label">IGST</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">{formatCurrency(gstr1?.total_igst || 0)}</p>
              </div>
              <div>
                <p className="metric-label">CGST + SGST</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">{formatCurrency((gstr1?.total_cgst || 0) + (gstr1?.total_sgst || 0))}</p>
              </div>
            </div>
          )}
        </SectionPanel>

        <SectionPanel title="GSTR-2A/2B — Input Tax Credit" subtitle="Inward supplies & ITC eligibility">
          {summary.loading ? (
            <LoadingState />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div>
                <p className="metric-label">Supplier Invoices</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">{gstr2a?.invoice_count || 0}</p>
              </div>
              <div>
                <p className="metric-label">Eligible ITC</p>
                <p className="text-lg font-semibold text-success tabular-nums">{formatCurrency(totalItc)}</p>
              </div>
              <div>
                <p className="metric-label">Taxable Value</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">{formatCurrency(gstr2a?.total_taxable || 0)}</p>
              </div>
              <div>
                <p className="metric-label">IGST Credit</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">{formatCurrency(gstr2a?.total_igst || 0)}</p>
              </div>
            </div>
          )}
        </SectionPanel>

        <SectionPanel title="GSTR-3B — Tax Liability" subtitle="Consolidated monthly return">
          {summary.loading ? (
            <LoadingState />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div>
                <p className="metric-label">Taxable Value</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">{formatCurrency(gstr3b?.total_taxable || 0)}</p>
              </div>
              <div>
                <p className="metric-label">IGST Liability</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">{formatCurrency(gstr3b?.total_igst || 0)}</p>
              </div>
              <div>
                <p className="metric-label">CGST Liability</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">{formatCurrency(gstr3b?.total_cgst || 0)}</p>
              </div>
              <div>
                <p className="metric-label">SGST Liability</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">{formatCurrency(gstr3b?.total_sgst || 0)}</p>
              </div>
            </div>
          )}
        </SectionPanel>

        <SectionPanel title="Filing Status" subtitle="Return processing status">
          {filingStatus.length > 0 ? (
            <DataTable
              columns={[
                { key: "form_type", header: "Form" },
                { key: "form_type_label", header: "Type" },
                {
                  key: "status_cd",
                  header: "Status",
                  render: (row: any) => (
                    <StatusBadge
                      status={row.status_cd === "Filed" ? "filed" : row.has_errors ? "error" : "pending"}
                      label={row.processing_status_label || row.status_cd || "Unknown"}
                    />
                  ),
                },
                { key: "year", header: "Year" },
                { key: "month", header: "Month" },
                {
                  key: "error_message",
                  header: "Errors",
                  render: (row: any) =>
                    row.has_errors ? (
                      <span className="text-destructive text-xs">{row.error_message}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    ),
                },
              ]}
              data={filingStatus}
            />
          ) : (
            <p className="text-sm text-muted-foreground pt-4">No filing status data available</p>
          )}
        </SectionPanel>

        <SectionPanel title="Ledger Analytics" subtitle="Cash, ITC & liability ledger balances">
          {ledger.loading ? (
            <LoadingState />
          ) : ledger.error ? (
            <ErrorState message={ledger.error} onRetry={ledger.refetch} />
          ) : ledger.data ? (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-md bg-muted/50">
                  <p className="metric-label">Cash Balance</p>
                  <p className="text-lg font-semibold text-foreground tabular-nums">
                    {formatCurrency(cashBalance)}
                  </p>
                </div>
                <div className="p-4 rounded-md bg-muted/50">
                  <p className="metric-label">ITC Balance</p>
                  <p className="text-lg font-semibold text-success tabular-nums">
                    {formatCurrency(itcBalance)}
                  </p>
                </div>
                <div className="p-4 rounded-md bg-muted/50">
                  <p className="metric-label">Transactions</p>
                  <p className="text-lg font-semibold text-foreground tabular-nums">
                    {transactionCount}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pt-4">No ledger data available</p>
          )}
        </SectionPanel>

        <SectionPanel title="Session Management" subtitle="GST API session status">
          {session.loading ? (
            <LoadingState />
          ) : sessionData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-md bg-muted/50">
                <p className="metric-label">Active Sessions</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-lg font-semibold text-foreground">{activeCount}</p>
                </div>
              </div>
              <div className="p-4 rounded-md bg-muted/50">
                <p className="metric-label">Expiry</p>
                <p className="text-sm text-foreground mt-1">
                  {sessionExpiry ? new Date(sessionExpiry).toLocaleString("en-IN") : "—"}
                </p>
              </div>
              <div className="p-4 rounded-md bg-muted/50">
                <p className="metric-label">Last Refresh</p>
                <p className="text-sm text-foreground mt-1">
                  {lastRefresh ? new Date(lastRefresh).toLocaleString("en-IN") : "—"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pt-4">No session data available</p>
          )}
        </SectionPanel>
      </div>

      <FetchDataModal
        open={fetchModalOpen}
        gstin={gstin!}
        onClose={() => setFetchModalOpen(false)}
        onComplete={handleFetchComplete}
      />
    </div>
  );
}
