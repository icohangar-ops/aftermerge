"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  buildLiveRun,
  preApprovalEvents,
  promoteEvents,
  rejectPatch,
} from "@/lib/live-scenario";
import { applyEvent } from "@/lib/reduce";
import { SEED_RUNS } from "@/lib/seed";
import type { PipelineRun, SimEvent } from "@/lib/types";

const STORAGE_KEY = "aftermerge.runs.v1";
const STORAGE_EVENT = "aftermerge-runs";

type Stored = { runs: PipelineRun[]; seq: number };

const serverSnapshot: Stored = { runs: SEED_RUNS, seq: 1842 };

let memory: Stored = serverSnapshot;
let clientReady = false;

function normalizeInterrupted(run: PipelineRun): PipelineRun {
  if (run.status !== "running" || !run.live) return run;
  return {
    ...run,
    status: "held",
    decision:
      "Simulation stopped when the page reloaded. Start a new merge to play the loop again.",
    stages: run.stages.map((stage) =>
      stage.status === "running"
        ? {
            ...stage,
            status: "held",
            summary: stage.summary || "Interrupted by a reload.",
            reasoning:
              stage.reasoning ||
              "The in-browser player does not resume a stage after refresh.",
          }
        : stage,
    ),
  };
}

function readStored(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!Array.isArray(parsed.runs) || parsed.runs.length === 0) return null;
    return {
      runs: parsed.runs.map(normalizeInterrupted),
      seq: typeof parsed.seq === "number" && parsed.seq >= 1842 ? parsed.seq : 1842,
    };
  } catch {
    return null;
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(STORAGE_EVENT, onStoreChange);
  return () => window.removeEventListener(STORAGE_EVENT, onStoreChange);
}

function getClientSnapshot(): Stored {
  if (!clientReady) {
    clientReady = true;
    memory = readStored() ?? serverSnapshot;
  }
  return memory;
}

function getServerSnapshot(): Stored {
  return serverSnapshot;
}

function commit(next: Stored) {
  memory = next;
  clientReady = true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode can reject storage. The in-memory board still updates.
  }
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

function update(fn: (current: Stored) => Stored) {
  commit(fn(getClientSnapshot()));
}

type RunsContextValue = {
  runs: PipelineRun[];
  simulateMerge: () => string;
  approve: (id: string) => void;
  requestChanges: (id: string) => void;
  getRun: (id: string) => PipelineRun | undefined;
};

const RunsContext = createContext<RunsContextValue | null>(null);

export function RunsProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const timers = useRef<Map<string, number[]>>(new Map());

  const play = useCallback((id: string, events: SimEvent[]) => {
    const existing = timers.current.get(id) ?? [];
    existing.forEach((handle) => window.clearTimeout(handle));
    const handles: number[] = [];
    let elapsed = 0;
    for (const event of events) {
      elapsed += event.delay;
      const handle = window.setTimeout(() => {
        update((current) => ({
          ...current,
          runs: current.runs.map((run) =>
            run.id === id ? applyEvent(run, event) : run,
          ),
        }));
      }, elapsed);
      handles.push(handle);
    }
    timers.current.set(id, handles);
  }, []);

  const simulateMerge = useCallback(() => {
    let id = "";
    update((current) => {
      const sequence = current.seq;
      id = `AM-${sequence}`;
      const run = buildLiveRun(id, sequence);
      return {
        seq: sequence + 1,
        runs: [run, ...current.runs.filter((item) => item.id !== id)],
      };
    });
    play(id, preApprovalEvents());
    return id;
  }, [play]);

  const approve = useCallback(
    (id: string) => {
      play(id, promoteEvents());
    },
    [play],
  );

  const requestChanges = useCallback((id: string) => {
    const existing = timers.current.get(id) ?? [];
    existing.forEach((handle) => window.clearTimeout(handle));
    timers.current.delete(id);
    update((current) => ({
      ...current,
      runs: current.runs.map((run) =>
        run.id === id ? rejectPatch().reduce(applyEvent, run) : run,
      ),
    }));
  }, []);

  const getRun = useCallback(
    (id: string) => snapshot.runs.find((run) => run.id === id),
    [snapshot.runs],
  );

  const value = useMemo(
    () => ({
      runs: snapshot.runs,
      simulateMerge,
      approve,
      requestChanges,
      getRun,
    }),
    [snapshot.runs, simulateMerge, approve, requestChanges, getRun],
  );

  return <RunsContext.Provider value={value}>{children}</RunsContext.Provider>;
}

export function useRuns() {
  const context = useContext(RunsContext);
  if (!context) {
    throw new Error("useRuns must be used within RunsProvider");
  }
  return context;
}
