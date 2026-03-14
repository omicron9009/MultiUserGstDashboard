import { formatCurrency } from "@/lib/utils";

interface ReportData {
  gstin: string;
  sessionActive: boolean;
  summary: any;
  ledger: any;
  returns: any;
}

export function generateDashboardReport(data: ReportData): void {
  const { gstin, sessionActive, summary, ledger } = data;

  const gstr1 = summary?.summary?.gstr1 || {};
  const gstr2a = summary?.summary?.gstr2a_itc || {};
  const gstr3b = summary?.summary?.gstr3b_liability || {};
  const filingStatus = summary?.filing_status || [];
  const balances = ledger?.balances || [];

  const totalLiability = (gstr3b.total_igst || 0) + (gstr3b.total_cgst || 0) + (gstr3b.total_sgst || 0);
  const totalItc = (gstr2a.total_igst || 0) + (gstr2a.total_cgst || 0) + (gstr2a.total_sgst || 0);

  const sumBalance = (type: string) =>
    balances.filter((b: any) => b.snapshot_type === type).reduce((t: number, b: any) => t + (b.amount || 0), 0);

  const now = new Date().toLocaleString("en-IN");

  const filingRows = filingStatus
    .map(
      (f: any) => `
      <tr>
        <td>${f.form_type || "—"}</td>
        <td>${f.form_type_label || "—"}</td>
        <td><span class="${f.status_cd === "Filed" ? "status-filed" : "status-pending"}">${f.status_cd || "Unknown"}</span></td>
        <td>${f.year || "—"}</td>
        <td>${f.month || "—"}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GST Dashboard Report — ${gstin}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; font-size: 14px; line-height: 1.6; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  h2 { font-size: 16px; font-weight: 600; margin: 32px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #1a1a2e; }
  .meta { color: #6b7280; font-size: 12px; }
  .meta span { font-family: monospace; font-weight: 600; color: #1a1a2e; }
  .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .card { padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
  .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 500; }
  .card-value { font-size: 20px; font-weight: 700; margin-top: 4px; font-variant-numeric: tabular-nums; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; }
  td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
  .status-filed { color: #15803d; font-weight: 500; }
  .status-pending { color: #d97706; font-weight: 500; }
  .section-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 8px; }
  .section-item { padding: 12px; background: #f9fafb; border-radius: 6px; }
  .section-item .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
  .section-item .value { font-size: 16px; font-weight: 600; margin-top: 2px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 11px; text-align: center; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
  .badge-active { background: #dcfce7; color: #15803d; }
  .badge-expired { background: #fee2e2; color: #dc2626; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>GST Dashboard Report</h1>
      <p class="meta" style="margin-top: 6px;">
        GSTIN: <span>${gstin}</span> &nbsp;|&nbsp;
        Session: <span class="badge ${sessionActive ? "badge-active" : "badge-expired"}">${sessionActive ? "Active" : "Expired"}</span>
      </p>
    </div>
    <div style="text-align: right;">
      <p class="meta">Generated: ${now}</p>
      <p class="meta" style="margin-top: 2px;">GST Intelligence Platform</p>
    </div>
  </div>

  <h2>Financial Summary</h2>
  <div class="cards">
    <div class="card">
      <div class="card-label">Total Tax Liability</div>
      <div class="card-value">${formatCurrency(totalLiability)}</div>
    </div>
    <div class="card">
      <div class="card-label">ITC Available</div>
      <div class="card-value" style="color: #15803d;">${formatCurrency(totalItc)}</div>
    </div>
    <div class="card">
      <div class="card-label">Net Payable</div>
      <div class="card-value">${formatCurrency(Math.max(0, totalLiability - totalItc))}</div>
    </div>
    <div class="card">
      <div class="card-label">Pending Filings</div>
      <div class="card-value">${filingStatus.filter((f: any) => f.status_cd !== "Filed").length}</div>
    </div>
  </div>

  <h2>GSTR-1 — Sales Summary</h2>
  <div class="section-grid">
    <div class="section-item"><div class="label">Invoices</div><div class="value">${gstr1.invoice_count || 0}</div></div>
    <div class="section-item"><div class="label">Taxable Value</div><div class="value">${formatCurrency(gstr1.total_taxable || 0)}</div></div>
    <div class="section-item"><div class="label">IGST</div><div class="value">${formatCurrency(gstr1.total_igst || 0)}</div></div>
    <div class="section-item"><div class="label">CGST + SGST</div><div class="value">${formatCurrency((gstr1.total_cgst || 0) + (gstr1.total_sgst || 0))}</div></div>
  </div>

  <h2>GSTR-2A/2B — Input Tax Credit</h2>
  <div class="section-grid">
    <div class="section-item"><div class="label">Supplier Invoices</div><div class="value">${gstr2a.invoice_count || 0}</div></div>
    <div class="section-item"><div class="label">Eligible ITC</div><div class="value" style="color: #15803d;">${formatCurrency(totalItc)}</div></div>
    <div class="section-item"><div class="label">Taxable Value</div><div class="value">${formatCurrency(gstr2a.total_taxable || 0)}</div></div>
    <div class="section-item"><div class="label">IGST Credit</div><div class="value">${formatCurrency(gstr2a.total_igst || 0)}</div></div>
  </div>

  <h2>GSTR-3B — Tax Liability</h2>
  <div class="section-grid">
    <div class="section-item"><div class="label">Taxable Value</div><div class="value">${formatCurrency(gstr3b.total_taxable || 0)}</div></div>
    <div class="section-item"><div class="label">IGST</div><div class="value">${formatCurrency(gstr3b.total_igst || 0)}</div></div>
    <div class="section-item"><div class="label">CGST</div><div class="value">${formatCurrency(gstr3b.total_cgst || 0)}</div></div>
    <div class="section-item"><div class="label">SGST</div><div class="value">${formatCurrency(gstr3b.total_sgst || 0)}</div></div>
  </div>

  <h2>Ledger Balances</h2>
  <div class="section-grid" style="grid-template-columns: repeat(3, 1fr);">
    <div class="section-item"><div class="label">Cash Balance</div><div class="value">${formatCurrency(sumBalance("cash"))}</div></div>
    <div class="section-item"><div class="label">ITC Balance</div><div class="value" style="color: #15803d;">${formatCurrency(sumBalance("itc"))}</div></div>
    <div class="section-item"><div class="label">Transactions</div><div class="value">${
      (ledger?.cash_ledger?.transaction_count || 0) +
      (ledger?.itc_ledger?.transaction_count || 0) +
      (ledger?.liability_ledger?.transaction_count || 0)
    }</div></div>
  </div>

  ${filingStatus.length > 0 ? `
  <h2>Filing Status</h2>
  <table>
    <thead>
      <tr><th>Form</th><th>Type</th><th>Status</th><th>Year</th><th>Month</th></tr>
    </thead>
    <tbody>${filingRows}</tbody>
  </table>` : ""}

  <div class="footer">
    This report was generated by the GST Intelligence Platform. For internal use only.
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${gstin}_dashboard.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
