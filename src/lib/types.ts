export type StageId =
  | "sast"
  | "deps"
  | "deploy"
  | "smoke"
  | "notes"
  | "approval"
  | "promote";

export type StageStatus =
  | "pending"
  | "running"
  | "passed"
  | "held"
  | "failed"
  | "awaiting"
  | "skipped";

export type RunStatus =
  | "running"
  | "awaiting-approval"
  | "promoted"
  | "held"
  | "rejected";

export type Risk = "low" | "medium" | "high" | "critical";

export type LogLevel = "info" | "warn" | "error" | "agent";

export interface LogLine {
  t: string;
  level: LogLevel;
  message: string;
}

export interface ToolCall {
  id: string;
  tool: string;
  args: string;
  result: string;
  ok: boolean;
  duration: string;
}

export interface Stage {
  id: StageId;
  label: string;
  hint: string;
  status: StageStatus;
  risk: Risk | null;
  summary: string;
  reasoning: string;
  logs: LogLine[];
  toolCalls: ToolCall[];
  durationLabel?: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface PipelineRun {
  id: string;
  mr: string;
  title: string;
  repo: string;
  branch: string;
  target: string;
  author: string;
  sha: string;
  mergedAt: string;
  status: RunStatus;
  risk: Risk;
  decision: string;
  approver?: string;
  live?: boolean;
  stages: Stage[];
}

export type SimEvent =
  | {
      delay: number;
      type: "log";
      stage: StageId;
      level: LogLevel;
      message: string;
    }
  | {
      delay: number;
      type: "tool";
      stage: StageId;
      call: Omit<ToolCall, "id"> & { id?: string };
    }
  | {
      delay: number;
      type: "stage";
      stage: StageId;
      status: StageStatus;
      risk?: Risk | null;
      summary?: string;
      reasoning?: string;
      durationLabel?: string;
    }
  | {
      delay: number;
      type: "run";
      status?: RunStatus;
      risk?: Risk;
      decision?: string;
      approver?: string;
    };
