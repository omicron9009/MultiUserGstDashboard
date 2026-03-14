import { useState } from "react";
import { X, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { authService } from "@/services/api";
import { toast } from "sonner";

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "credentials" | "otp" | "success";

export function AddClientModal({ open, onClose, onSuccess }: AddClientModalProps) {
  const [step, setStep] = useState<Step>("credentials");
  const [username, setUsername] = useState("");
  const [gstin, setGstin] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setStep("credentials");
    setUsername("");
    setGstin("");
    setOtp("");
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleGenerateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.generateOtp(username, gstin);
      setStep("otp");
      toast.info("OTP sent to registered mobile");
    } catch (err: any) {
      setError(err.message || "Failed to generate OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.verifyOtp(username, gstin, otp);
      setStep("success");
      toast.success("Client added successfully");
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-lg">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Add New Client</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === "credentials" && "Step 1 — Enter GST portal credentials"}
              {step === "otp" && "Step 2 — Verify OTP"}
              {step === "success" && "Client authenticated"}
            </p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-5">
            {["credentials", "otp", "success"].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= ["credentials", "otp", "success"].indexOf(step)
                    ? "bg-primary"
                    : "bg-muted"
                }`} />
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
          )}

          {step === "credentials" && (
            <form onSubmit={handleGenerateOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="GST portal username"
                  required
                  className="w-full px-3 py-2.5 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">GSTIN</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 27AABFP2335E1ZM"
                  required
                  maxLength={15}
                  className="w-full px-3 py-2.5 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !username || !gstin}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Request OTP
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-md bg-muted/50 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">GSTIN:</span> {gstin}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">One-Time Password</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-md border border-input bg-background text-sm text-foreground text-center tracking-[0.5em] font-mono placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !otp}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Verify & Add Client
              </button>
              <button
                type="button"
                onClick={() => { setStep("credentials"); setOtp(""); setError(""); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center py-6">
              <CheckCircle2 className="w-12 h-12 text-success mb-3" />
              <p className="text-sm font-medium text-foreground">Client added successfully</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{gstin}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
