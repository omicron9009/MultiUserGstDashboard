import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/api";
import { LayoutDashboard, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [username, setUsername] = useState("");
  const [gstin, setGstin] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.generateOtp(username, gstin);
      setStep("otp");
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
      login(username);
      navigate("/clients");
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-primary" />
          <span className="text-lg font-semibold text-sidebar-foreground">GST Intelligence</span>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-sidebar-foreground leading-tight">
            Multi-client GST<br />analytics platform
          </h2>
          <p className="text-sidebar-muted text-sm max-w-sm">
            Manage GSTR filings, ITC credits, ledger balances, and compliance status for all your clients in one place.
          </p>
        </div>
        <p className="text-xs text-sidebar-muted">
          Built for Chartered Accountants
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {step === "credentials" ? "Sign in" : "Enter OTP"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {step === "credentials"
                ? "Use your GST portal credentials to authenticate"
                : `OTP sent for GSTIN ${gstin}`}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {step === "credentials" ? (
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
                Generate OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
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
                Verify & Sign In
              </button>
              <button
                type="button"
                onClick={() => { setStep("credentials"); setOtp(""); setError(""); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to credentials
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
