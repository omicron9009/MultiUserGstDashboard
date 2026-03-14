import { useState } from "react";
import { X, Loader2, CheckCircle2, AlertCircle, Database } from "lucide-react";
import { gstr1Service, gstr2aService, gstr2bService, gstr3bService, ledgerService } from "@/services/api";
import { toast } from "sonner";

interface FetchDataModalProps {
  open: boolean;
  gstin: string;
  onClose: () => void;
  onComplete: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => String(currentYear - i));

interface FetchStep {
  label: string;
  status: "pending" | "loading" | "done" | "error";
  error?: string;
}

export function FetchDataModal({ open, gstin, onClose, onComplete }: FetchDataModalProps) {
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [fetching, setFetching] = useState(false);
  const [steps, setSteps] = useState<FetchStep[]>([]);

  const updateStep = (index: number, update: Partial<FetchStep>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...update } : s)));
  };

  const handleFetch = async () => {
    const m = month.padStart(2, "0");
    const fetchSteps: { label: string; fn: () => Promise<unknown> }[] = [
      { label: "GSTR-1 Summary", fn: () => gstr1Service.getSummary(gstin, year, m) },
      { label: "GSTR-1 B2B Invoices", fn: () => gstr1Service.getB2B(gstin, year, m) },
      { label: "GSTR-1 B2CS Sales", fn: () => gstr1Service.getB2CS(gstin, year, m) },
      { label: "GSTR-1 HSN Summary", fn: () => gstr1Service.getHSN(gstin, year, m) },
      { label: "GSTR-1 Advance Tax", fn: () => gstr1Service.getAdvanceTax(gstin, year, m) },
      { label: "GSTR-2A B2B", fn: () => gstr2aService.getB2B(gstin, year, m) },
      { label: "GSTR-2A CDN", fn: () => gstr2aService.getCDN(gstin, year, m) },
      { label: "GSTR-2A Documents", fn: () => gstr2aService.getDocument(gstin, year, m) },
      { label: "GSTR-2B Data", fn: () => gstr2bService.get(gstin, year, m) },
      { label: "GSTR-3B Details", fn: () => gstr3bService.getDetails(gstin, year, m) },
      { label: "GSTR-3B Auto Liability", fn: () => gstr3bService.getAutoLiability(gstin, year, m) },
      { label: "Ledger Balance", fn: () => ledgerService.getBalance(gstin, year, m) },
    ];

    setSteps(fetchSteps.map((s) => ({ label: s.label, status: "pending" })));
    setFetching(true);

    let successCount = 0;
    for (let i = 0; i < fetchSteps.length; i++) {
      updateStep(i, { status: "loading" });
      try {
        await fetchSteps[i].fn();
        updateStep(i, { status: "done" });
        successCount++;
      } catch (err: any) {
        updateStep(i, { status: "error", error: err.message || "Failed" });
      }
    }

    setFetching(false);
    toast.success(`Fetched ${successCount}/${fetchSteps.length} datasets for ${MONTHS[Number(month) - 1]} ${year}`);
    onComplete();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={fetching ? undefined : onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Fetch GST Data
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{gstin}</p>
          </div>
          {!fetching && (
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {!fetching && steps.length === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={String(i + 1).padStart(2, "0")}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
                This will fetch GSTR-1, 2A, 2B, 3B data and ledger balances from the GST portal.
                Data is automatically saved to the database by the backend.
              </div>

              <button
                onClick={handleFetch}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Database className="w-4 h-4" />
                Fetch All Data
              </button>
            </div>
          )}

          {steps.length > 0 && (
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted/30">
                  {step.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                  {step.status === "loading" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  {step.status === "done" && <CheckCircle2 className="w-4 h-4 text-success" />}
                  {step.status === "error" && <AlertCircle className="w-4 h-4 text-destructive" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{step.label}</p>
                    {step.error && <p className="text-xs text-destructive truncate">{step.error}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!fetching && steps.length > 0 && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => { setSteps([]); }}
                className="flex-1 px-4 py-2 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Fetch Another Period
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
