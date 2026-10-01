"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dashboard } from "@/components/dashboard";
import { RunDetail } from "@/components/run-detail";
import { useRuns } from "@/lib/runs-context";
import type { StageId } from "@/lib/types";
import { cn } from "@/lib/utils";

type Beat = {
  id: string;
  label: string;
  seconds: number | null;
  view: "title" | "board" | "run" | "close";
  script: string;
  stage?: StageId;
};

const BEATS: Beat[] = [
  {
    id: "open",
    label: "Open",
    seconds: 18,
    view: "title",
    script:
      "AfterMerge is a post-merge agent for Northline Mechanical. FieldClear's code is merged. The agent takes it from here: security, dependencies, staging, smoke, release notes, a human gate, then production.",
  },
  {
    id: "board",
    label: "Board",
    seconds: 20,
    view: "board",
    script:
      "This is the pipeline board. Every row is a merged merge request. Some were promoted. One is waiting on a person. One was held because a critical dependency was actually reachable. The agent writes down why.",
  },
  {
    id: "merge",
    label: "Merge",
    seconds: 10,
    view: "board",
    script:
      "I'll simulate a merge on fieldclear/compliance-portal. Nightly refrigerant log sync. No GitLab token — this is the same loop a webhook would start.",
  },
  {
    id: "sast",
    label: "SAST",
    seconds: 28,
    view: "run",
    stage: "sast",
    script:
      "Semgrep runs the GitLab SAST ruleset. It finds a medium hit: on retry, the portal client logs a four-character token prefix. The agent checks production log level, decides the prefix is not a credential, files follow-up issue 902, and continues. Risk stays medium. That means no auto-promote.",
  },
  {
    id: "deps",
    label: "Dependencies",
    seconds: 20,
    view: "run",
    stage: "deps",
    script:
      "Gemnasium flags a high advisory in fast-xml-parser. The agent traces the call path. It is only in a fixture script, not the sync job. The production npm graph is clean. Waiver recorded. Staging is next.",
  },
  {
    id: "smoke",
    label: "Staging and smoke",
    seconds: 24,
    view: "run",
    stage: "smoke",
    script:
      "Staging deploys to FieldClear staging. Health check is green. Playwright runs three smokes. The state-portal mock returns 429 on the first retry test. The agent reruns that test once. It passes. The dry-run asserts that no refrigerant quantity was written.",
  },
  {
    id: "notes",
    label: "Release notes",
    seconds: 16,
    view: "run",
    stage: "notes",
    script:
      "The agent drafts release notes for field ops. Dry-run stays on for the first production night. No migration. The debug-log follow-up is in the notes. Then policy stops the line.",
  },
  {
    id: "gate",
    label: "Approval",
    seconds: null,
    view: "run",
    stage: "approval",
    script:
      "Medium risk. A person has to approve. Dana Okonkwo owns field operations. This is the gate. Approve to promote — or request changes and the agent will not ship.",
  },
  {
    id: "promote",
    label: "Promote",
    seconds: 14,
    view: "run",
    stage: "promote",
    script:
      "Approved. The agent promotes compliance-portal to production, records the approver, and closes the run. The decision log is the audit trail.",
  },
  {
    id: "close",
    label: "Close",
    seconds: 18,
    view: "close",
    script:
      "That is Life After Code: an agent that owns the lifecycle after the merge. Path A — a new demo, not a wrapper around an existing product. The stages map onto GitLab CI jobs and a merge webhook.",
  },
];

function formatClock(total: number) {
  const seconds = Math.max(0, Math.floor(total));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function plannedStamp(index: number) {
  const seconds = BEATS.slice(0, index).reduce(
    (sum, beat) => sum + (beat.seconds ?? 12),
    0,
  );
  return formatClock(seconds);
}

export function DemoPlayer() {
  const { simulateMerge, runs } = useRuns();
  const [phase, setPhase] = useState<"idle" | "playing" | "paused" | "done">("idle");
  const [beatIndex, setBeatIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [simId, setSimId] = useState<string | null>(null);
  const deadline = useRef<number | null>(null);
  const simStarted = useRef(false);
  const lock = useRef(false);

  const beat = BEATS[Math.min(beatIndex, BEATS.length - 1)];
  const run = simId ? runs.find((item) => item.id === simId) : undefined;
  const rejected = run?.status === "rejected";

  const advance = useCallback(() => {
    if (lock.current) return;
    lock.current = true;
    deadline.current = null;
    setBeatIndex((current) => {
      if (current >= BEATS.length - 1) {
        setPhase("done");
        return current;
      }
      return current + 1;
    });
  }, []);

  useEffect(() => {
    lock.current = false;
  }, [beatIndex]);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 0.25);
    }, 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (beat.seconds == null) return;
    if (deadline.current == null) {
      deadline.current = Date.now() + beat.seconds * 1000;
    }
    const wait = Math.max(0, deadline.current - Date.now());
    const timer = window.setTimeout(() => {
      if (beatIndex >= BEATS.length - 1) {
        setPhase("done");
        return;
      }
      advance();
    }, wait);
    return () => window.clearTimeout(timer);
  }, [phase, beatIndex, beat.seconds, advance]);

  useEffect(() => {
    if (phase !== "playing" || beat.id !== "sast") return;
    const timer = window.setTimeout(() => {
      if (simStarted.current) return;
      simStarted.current = true;
      setSimId(simulateMerge());
    }, 40);
    return () => window.clearTimeout(timer);
  }, [phase, beat.id, simulateMerge]);

  useEffect(() => {
    if (phase !== "playing" || beat.id !== "gate" || !run) return;
    const approval = run.stages.find((stage) => stage.id === "approval");
    if (
      approval?.status === "passed" ||
      approval?.status === "held" ||
      run.status === "rejected"
    ) {
      advance();
    }
  }, [phase, beat.id, run, advance]);

  function start() {
    simStarted.current = false;
    deadline.current = null;
    setSimId(null);
    setBeatIndex(0);
    setElapsed(0);
    setPhase("playing");
  }

  function restart() {
    simStarted.current = false;
    deadline.current = null;
    setSimId(null);
    setBeatIndex(0);
    setElapsed(0);
    setPhase("idle");
  }

  const script =
    beat.id === "promote" && rejected
      ? "Changes requested. The agent cancels production and leaves the reason in the log. The gate is the point — it does not ship past a person."
      : beat.script;

  return (
    <div className="flex min-h-screen flex-col bg-[#070c12] text-foreground lg:flex-row">
      <aside className="border-b border-white/10 lg:flex lg:w-[340px] lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[11px] tracking-[0.16em] text-cyan-200 uppercase">
              AfterMerge demo
            </p>
            <p className="font-mono text-lg tabular-nums text-cyan-100">
              {formatClock(elapsed)}
            </p>
          </div>
          <div className="flex gap-1">
            {phase === "idle" || phase === "done" ? (
              <Button size="sm" onClick={start}>
                <Play />
                {phase === "done" ? "Replay" : "Start"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setPhase((current) => (current === "paused" ? "playing" : "paused"))
                }
              >
                {phase === "paused" ? <Play /> : <Pause />}
                {phase === "paused" ? "Resume" : "Pause"}
              </Button>
            )}
            <Button size="icon-sm" variant="ghost" onClick={restart} aria-label="Reset demo">
              <RotateCcw />
            </Button>
          </div>
        </div>
        <ol className="hidden max-h-[40vh] space-y-1 overflow-auto px-3 pb-3 lg:block lg:max-h-none lg:flex-1">
          {BEATS.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={cn(
                  "w-full rounded-md px-2 py-1.5 text-left",
                  index === beatIndex && phase !== "idle"
                    ? "bg-cyan-400/10 text-cyan-50"
                    : "text-muted-foreground",
                )}
                onClick={() => {
                  if (phase === "idle") return;
                  deadline.current = null;
                  setBeatIndex(index);
                  if (phase === "done") setPhase("playing");
                }}
              >
                <span className="font-mono text-[10px] text-cyan-200/70">
                  {plannedStamp(index)}
                </span>{" "}
                <span className="text-xs">{item.label}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="px-4 pb-3 text-[11px] leading-relaxed text-muted-foreground">
          Record this page. Press Start and let it run. Approve when the gate
          appears, about {plannedStamp(BEATS.findIndex((item) => item.id === "gate"))}.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          {phase === "idle" && <IdleCard onStart={start} />}
          {phase !== "idle" && beat.view === "title" && <TitleCard />}
          {phase !== "idle" && beat.view === "board" && <Dashboard embedded />}
          {phase !== "idle" && beat.view === "run" && (
            simId ? (
              <RunDetail
                id={simId}
                emphasisStage={beat.stage}
                cueApprove={beat.id === "gate"}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Starting the merge…</p>
            )
          )}
          {phase !== "idle" && beat.view === "close" && (
            <CloseCard rejected={rejected} onReplay={start} />
          )}
        </div>
        {phase !== "idle" && (
          <div className="border-t border-cyan-400/20 bg-[#0c1722] px-4 py-4 sm:px-6">
            <p className="text-[11px] tracking-[0.16em] text-cyan-200/80 uppercase">
              {beat.label}
              {phase === "paused" ? " · paused" : ""}
              {phase === "done" ? " · end" : ""}
              {beat.id === "gate" ? " · click Approve promote" : ""}
            </p>
            <p className="mt-1 max-w-3xl text-base leading-relaxed text-pretty sm:text-lg">
              {script}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function IdleCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center gap-5">
      <p className="text-[11px] tracking-[0.18em] text-cyan-200 uppercase">
        Screen-record route
      </p>
      <h1 className="text-4xl font-medium tracking-tight text-balance">
        Three minutes. One merge. The life after code.
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        This page is the recording script for the GitLab Life After Code demo.
        Start it, leave the narration on screen, and approve the promote when
        the gate lights up. The whole loop is simulated.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={onStart}>
          <Play />
          Start 3-minute demo
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/">Open the board</Link>
        </Button>
      </div>
    </div>
  );
}

function TitleCard() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center gap-4">
      <p className="text-[11px] tracking-[0.18em] text-cyan-200 uppercase">
        Northline Mechanical · FieldClear
      </p>
      <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">AfterMerge</h1>
      <p className="text-lg text-muted-foreground">
        The merge is the starting line. An agent owns what happens next.
      </p>
      <ol className="mt-2 grid gap-2 text-sm text-foreground/90 sm:grid-cols-2">
        {[
          "SAST",
          "Dependencies",
          "Staging deploy",
          "Smoke tests",
          "Release notes",
          "Human approval",
          "Promote",
        ].map((item, index) => (
          <li key={item} className="rounded-md border border-white/10 px-3 py-2">
            <span className="mr-2 font-mono text-xs text-cyan-200">0{index + 1}</span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  );
}

function CloseCard({
  rejected,
  onReplay,
}: {
  rejected: boolean;
  onReplay: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center gap-4">
      <p className="text-[11px] tracking-[0.18em] text-cyan-200 uppercase">
        Path A · Life After Code
      </p>
      <h1 className="text-3xl font-medium tracking-tight text-balance sm:text-4xl">
        {rejected
          ? "The agent stopped. That is the gate doing its job."
          : "Post-code, owned by an agent, stopped by a person."}
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        AfterMerge is a new console for a fictional mechanical-contractor SaaS.
        It does not wrap an existing product. Swap the in-browser player for a
        GitLab merge webhook and the same seven stages map onto CI jobs.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/">Back to the board</Link>
        </Button>
        <Button variant="outline" onClick={onReplay}>
          Replay from the start
        </Button>
      </div>
    </div>
  );
}
