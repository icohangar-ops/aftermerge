"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  FileText,
  FlaskConical,
  Package,
  Rocket,
  ScrollText,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RiskPill, RunStatusPill, StageStatusPill } from "@/components/status-pill";
import { useRuns } from "@/lib/runs-context";
import { POLICY, currentStage, formatWhen } from "@/lib/stages";
import type { LogLine, Stage, StageId, ToolCall } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<StageId, typeof ShieldCheck> = {
  sast: ShieldCheck,
  deps: Package,
  deploy: Rocket,
  smoke: FlaskConical,
  notes: ScrollText,
  approval: UserRoundCheck,
  promote: FileText,
};

export function RunDetail({
  id,
  emphasisStage,
  cueApprove = false,
}: {
  id: string;
  emphasisStage?: StageId;
  cueApprove?: boolean;
}) {
  const { getRun, approve, requestChanges } = useRuns();
  const run = getRun(id);
  const pinKey = `${id}:${emphasisStage ?? ""}`;
  const [pin, setPin] = useState<{ key: string; stage: StageId } | null>(null);
  const pinned = pin?.key === pinKey ? pin.stage : null;

  if (!run) {
    return (
      <Card className="items-start gap-2 p-6">
        <p className="text-lg font-medium">This run is not on the board.</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {id} is not in this browser&apos;s simulated history. The board still has
          the FieldClear merges, and you can start a new one.
        </p>
        <Button asChild className="mt-2">
          <Link href="/">Back to the board</Link>
        </Button>
      </Card>
    );
  }

  const active = currentStage(run);
  const focusId = pinned ?? emphasisStage ?? active.id;
  const focus = run.stages.find((stage) => stage.id === focusId) ?? active;
  const waiting = run.status === "awaiting-approval";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Board
        </Link>
        <span>/</span>
        <span className="font-mono text-cyan-200">{run.id}</span>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <RunStatusPill status={run.status} />
          <RiskPill risk={run.risk} />
          {run.live && (
            <span className="text-[11px] tracking-[0.14em] text-cyan-200/80 uppercase">
              Simulated merge
            </span>
          )}
        </div>
        <h1 className="max-w-3xl text-2xl font-medium tracking-tight text-balance sm:text-3xl">
          {run.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {run.repo}
          {run.mr} · {run.branch} → {run.target} · {run.author} ·{" "}
          <span className="font-mono text-foreground/80">{run.sha}</span>
        </p>
        <p className="text-xs text-muted-foreground">Merged {formatWhen(run.mergedAt)}</p>
      </header>

      {run.status === "held" && (
        <Banner tone="rose" title="The agent held this merge." body={run.decision} />
      )}
      {run.status === "rejected" && (
        <Banner tone="rose" title="Changes requested." body={run.decision} />
      )}
      {waiting && (
        <Banner
          tone="amber"
          title="A person has to open the gate."
          body={run.decision}
        />
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <AgentPanel
          decision={run.decision}
          stage={focus}
          waiting={waiting}
          cueApprove={cueApprove && waiting}
          onApprove={() => approve(run.id)}
          onReject={() => requestChanges(run.id)}
          className={cn(
            "lg:sticky lg:z-10 lg:order-2 lg:max-h-[calc(100vh-8rem)]",
            emphasisStage ? "lg:top-3" : "lg:top-24",
          )}
        />

        <ol className="space-y-2 lg:order-1">
          {run.stages.map((stage, index) => (
            <StageRow
              key={stage.id}
              stage={stage}
              index={index}
              selected={stage.id === focus.id}
              follow={emphasisStage === stage.id}
              onSelect={() => setPin({ key: pinKey, stage: stage.id })}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}

function Banner({
  tone,
  title,
  body,
}: {
  tone: "amber" | "rose";
  title: string;
  body: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "amber"
          ? "border-amber-300/30 bg-amber-300/10"
          : "border-rose-400/30 bg-rose-400/10",
      )}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function StageRow({
  stage,
  index,
  selected,
  follow,
  onSelect,
}: {
  stage: Stage;
  index: number;
  selected: boolean;
  follow: boolean;
  onSelect: () => void;
}) {
  const Icon = ICONS[stage.id];
  const rowRef = useRef<HTMLLIElement>(null);
  const open = selected && stage.status !== "pending" && stage.status !== "skipped";

  useEffect(() => {
    if (!follow) return;
    rowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [follow, stage.status, stage.logs.length]);

  return (
    <li ref={rowRef} id={`stage-${stage.id}`}>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full rounded-xl border px-3 py-3 text-left transition-colors",
          selected
            ? "border-cyan-400/40 bg-cyan-400/5"
            : "border-white/10 bg-card/70 hover:border-white/20",
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border",
              stage.status === "running" && "border-cyan-400/50 text-cyan-200",
              stage.status === "passed" && "border-emerald-400/40 text-emerald-200",
              (stage.status === "held" || stage.status === "failed") &&
                "border-rose-400/40 text-rose-200",
              stage.status === "awaiting" && "border-amber-300/40 text-amber-100",
              (stage.status === "pending" || stage.status === "skipped") &&
                "border-white/10 text-muted-foreground",
            )}
          >
            <Icon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                0{index + 1}
              </span>
              <span className="font-medium">{stage.label}</span>
              <StageStatusPill status={stage.status} />
              {stage.durationLabel && (
                <span className="text-xs text-muted-foreground">{stage.durationLabel}</span>
              )}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{stage.hint}</span>
            {stage.summary && (
              <span className="mt-2 block text-sm whitespace-pre-wrap text-foreground/90">
                {stage.summary}
              </span>
            )}
          </span>
        </div>
        {open && stage.logs.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-lg border border-white/10 bg-black/40">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-1.5">
              <span className="size-1.5 rounded-full bg-rose-400/80" />
              <span className="size-1.5 rounded-full bg-amber-300/80" />
              <span className="size-1.5 rounded-full bg-emerald-400/80" />
              <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                {stage.id}.log
              </span>
            </div>
            <pre className="max-h-48 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-300">
              {stage.logs.map((entry, lineIndex) => (
                <LogRow key={`${entry.t}-${lineIndex}`} entry={entry} />
              ))}
            </pre>
          </div>
        )}
      </button>
    </li>
  );
}

function LogRow({ entry }: { entry: LogLine }) {
  return (
    <span className="block">
      <span className="text-slate-500">{entry.t}</span>{" "}
      <span
        className={cn(
          entry.level === "agent" && "text-cyan-300",
          entry.level === "warn" && "text-amber-200",
          entry.level === "error" && "text-rose-300",
          entry.level === "info" && "text-slate-300",
        )}
      >
        {entry.level === "agent" ? "agent" : entry.level}
      </span>{" "}
      {entry.message}
    </span>
  );
}

function AgentPanel({
  decision,
  stage,
  waiting,
  cueApprove,
  onApprove,
  onReject,
  className,
}: {
  decision: string;
  stage: Stage;
  waiting: boolean;
  cueApprove: boolean;
  onApprove: () => void;
  onReject: () => void;
  className?: string;
}) {
  return (
    <Card className={cn("h-fit gap-0 py-0", className)}>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-[11px] tracking-[0.16em] text-cyan-200/80 uppercase">
            AfterMerge agent
          </p>
          <p className="mt-1 text-sm leading-relaxed">{decision}</p>
        </div>
        {waiting && (
          <div
            className={cn(
              "flex flex-col gap-2 rounded-lg border border-amber-300/30 bg-amber-300/10 p-3",
              cueApprove && "ring-2 ring-amber-200/70 ring-offset-2 ring-offset-background",
            )}
          >
            <p className="text-xs text-amber-50">
              Dana Okonkwo can approve the promote or send it back. The agent will not ship on its own.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onApprove}>
                Approve promote
              </Button>
              <Button size="sm" variant="destructive" onClick={onReject}>
                Request changes
              </Button>
            </div>
          </div>
        )}
      </div>
      <Separator />
      <ScrollArea className="max-h-[540px]">
        <div className="space-y-4 p-4">
          <div>
            <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              Why this stage
            </p>
            <p className="mt-1 text-sm font-medium">{stage.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {stage.reasoning ||
                "The agent has not written a decision for this stage yet."}
            </p>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              Tool calls
            </p>
            {stage.toolCalls.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">None yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {stage.toolCalls.map((call) => (
                  <ToolRow key={call.id} call={call} />
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              Policy
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{POLICY}</p>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}

function ToolRow({ call }: { call: ToolCall }) {
  return (
    <li className="rounded-lg border border-white/10 bg-black/30 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-xs text-cyan-200">{call.tool}</p>
        <p className={cn("text-[11px]", call.ok ? "text-emerald-300" : "text-rose-300")}>
          {call.ok ? "ok" : "fail"} · {call.duration}
        </p>
      </div>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{call.args}</p>
      <p className="mt-1 text-xs">{call.result}</p>
    </li>
  );
}
