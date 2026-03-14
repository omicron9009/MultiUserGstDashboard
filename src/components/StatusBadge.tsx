import { cn } from "@/lib/utils";

type Status = "active" | "expired" | "pending" | "filed" | "error" | "review";

const statusConfig: Record<Status, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  filed: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  expired: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  error: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  pending: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  review: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
};

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", config.bg, config.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {label || status}
    </span>
  );
}
