"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { SimulateButton } from "@/components/shell";
import { RiskPill, RunStatusPill } from "@/components/status-pill";
import { useRuns } from "@/lib/runs-context";
import { currentStage, formatWhen } from "@/lib/stages";
import type { PipelineRun } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "running" | "awaiting-approval" | "held" | "promoted";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "running", label: "In progress" },
  { id: "awaiting-approval", label: "Needs approval" },
  { id: "held", label: "Held" },
  { id: "promoted", label: "Promoted" },
];

function matches(run: PipelineRun, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "held") return run.status === "held" || run.status === "rejected";
  return run.status === filter;
}

export function Dashboard({ embedded = false }: { embedded?: boolean }) {
  const { runs } = useRuns();
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    return {
      board: runs.length,
      approval: runs.filter((run) => run.status === "awaiting-approval").length,
      held: runs.filter((run) => run.status === "held" || run.status === "rejected")
        .length,
      promoted: runs.filter((run) => run.status === "promoted").length,
    };
  }, [runs]);

  const visible = runs.filter((run) => matches(run, filter));

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-card to-card">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div className="max-w-xl space-y-2">
            <p className="text-[11px] font-medium tracking-[0.16em] text-cyan-200/80 uppercase">
              After the merge
            </p>
            <h1 className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
              The agent owns the line from scan to production.
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              FieldClear just merged. AfterMerge runs SAST, dependency audit,
              staging, smoke, release notes, a human gate, and promote. Simulate
              a merge to watch it decide — nothing calls GitLab.
            </p>
          </div>
          {embedded ? (
            <p className="max-w-xs text-sm text-cyan-100/80">
              The demo starts this merge on its own. On the board, use Simulate merge.
            </p>
          ) : (
            <SimulateButton />
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="On the board" value={counts.board} />
        <Stat label="Awaiting a person" value={counts.approval} />
        <Stat label="Held before promote" value={counts.held} />
        <Stat label="Promoted" value={counts.promoted} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs",
                filter === item.id
                  ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                  : "border-white/10 text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <Card className="items-start gap-1 p-6">
            <p className="font-medium">No runs in this filter.</p>
            <p className="text-muted-foreground">
              The board still has other merges. Switch filters, or simulate a new one.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            <div className="hidden grid-cols-[92px_minmax(0,1.4fr)_minmax(0,0.8fr)_120px_130px] gap-3 px-3 text-[11px] tracking-[0.14em] text-muted-foreground uppercase md:grid">
              <span>Run</span>
              <span>Merge request</span>
              <span>Stage</span>
              <span>Risk</span>
              <span>Status</span>
            </div>
            {visible.map((run) => (
              <RunRow key={run.id} run={run} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card size="sm" className="gap-1">
      <p className="px-3 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="px-3 text-2xl font-medium tracking-tight tabular-nums">{value}</p>
    </Card>
  );
}

function RunRow({ run }: { run: PipelineRun }) {
  const stage = currentStage(run);
  return (
    <Link
      href={`/runs/${run.id}`}
      className="block rounded-xl border border-white/10 bg-card/80 p-3 transition-colors hover:border-cyan-400/30 hover:bg-cyan-400/5"
    >
      <div className="grid gap-3 md:grid-cols-[92px_minmax(0,1.4fr)_minmax(0,0.8fr)_120px_130px] md:items-center">
        <div>
          <p className="font-mono text-sm text-cyan-200">{run.id}</p>
          <p className="text-[11px] text-muted-foreground">{formatWhen(run.mergedAt)}</p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{run.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {run.repo}
            {run.mr} · {run.author}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {stage.label}
          <span className="hidden text-xs sm:inline"> · {stage.hint}</span>
        </p>
        <RiskPill risk={run.risk} />
        <RunStatusPill status={run.status} />
      </div>
    </Link>
  );
}
