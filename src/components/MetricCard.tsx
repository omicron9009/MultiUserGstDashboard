import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function MetricCard({ label, value, subValue, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn("glass-card p-5", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="metric-label">{label}</p>
          <p className="metric-value">{value}</p>
          {subValue && (
            <p className={cn(
              "text-xs font-medium",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              (!trend || trend === "neutral") && "text-muted-foreground"
            )}>
              {subValue}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2 rounded-md bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
