import { Badge } from "@/components/ui/badge";
import { riskLabel, stageStatusLabel, statusLabel } from "@/lib/stages";
import type { Risk, RunStatus, StageStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const runStyles: Record<RunStatus, string> = {
  running: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  "awaiting-approval": "border-amber-300/40 bg-amber-300/10 text-amber-100",
  promoted: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  held: "border-rose-400/40 bg-rose-400/10 text-rose-200",
  rejected: "border-rose-300/40 bg-rose-300/10 text-rose-100",
};

const stageStyles: Record<StageStatus, string> = {
  pending: "border-border bg-transparent text-muted-foreground",
  running: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  passed: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  held: "border-rose-400/40 bg-rose-400/10 text-rose-200",
  failed: "border-rose-400/40 bg-rose-400/10 text-rose-200",
  awaiting: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  skipped: "border-border bg-transparent text-muted-foreground",
};

const riskStyles: Record<Risk, string> = {
  low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  medium: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  high: "border-orange-400/40 bg-orange-400/10 text-orange-100",
  critical: "border-rose-400/50 bg-rose-400/15 text-rose-100",
};

export function RunStatusPill({ status }: { status: RunStatus }) {
  return (
    <Badge variant="outline" className={cn("h-6 rounded-md px-2", runStyles[status])}>
      {status === "running" && (
        <span className="size-1.5 animate-pulse rounded-full bg-cyan-300" />
      )}
      {statusLabel(status)}
    </Badge>
  );
}

export function StageStatusPill({ status }: { status: StageStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("h-6 rounded-md px-2", stageStyles[status])}
    >
      {status === "running" && (
        <span className="size-1.5 animate-pulse rounded-full bg-cyan-300" />
      )}
      {stageStatusLabel(status)}
    </Badge>
  );
}

export function RiskPill({ risk }: { risk: Risk }) {
  return (
    <Badge variant="outline" className={cn("h-6 rounded-md px-2", riskStyles[risk])}>
     {riskLabel(risk)} risk
    </Badge>
  );
}

