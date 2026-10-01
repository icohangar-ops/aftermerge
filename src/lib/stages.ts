import type {
  PipelineRun,
  Risk,
  RunStatus,
  Stage,
  StageId,
  StageStatus,
} from "@/lib/types";

export const POLICY =
  "FieldClear policy: critical findings hold before staging. Medium and high risk stop for a named approver. Low risk with green smoke may auto-promote, and field ops is still notified.";

export const STAGE_ORDER: { id: StageId; label: string; hint: string }[] = [
  { id: "sast", label: "SAST", hint: "Semgrep · GitLab SAST" },
  { id: "deps", label: "Dependencies", hint: "Gemnasium · npm audit" },
  { id: "deploy", label: "Staging deploy", hint: "GitLab environment" },
  { id: "smoke", label: "Smoke tests", hint: "Playwright · dry-run" },
  { id: "notes", label: "Release notes", hint: "Draft for field ops" },
  { id: "approval", label: "Human approval", hint: "Policy gate" },
  { id: "promote", label: "Promote", hint: "Production" },
];

export function blankStages(): Stage[] {
  return STAGE_ORDER.map((meta) => ({
    id: meta.id,
    label: meta.label,
    hint: meta.hint,
    status: "pending",
    risk: null,
    summary: "",
    reasoning: "",
    logs: [],
    toolCalls: [],
  }));
}

export function stageMeta(id: StageId) {
  return STAGE_ORDER.find((stage) => stage.id === id)!;
}

export function currentStage(run: PipelineRun): Stage {
  return (
    run.stages.find(
      (stage) => stage.status === "running" || stage.status === "awaiting",
    ) ??
    [...run.stages]
      .reverse()
      .find(
        (stage) => stage.status !== "pending" && stage.status !== "skipped",
      ) ??
    run.stages[0]
  );
}

export function statusLabel(status: RunStatus): string {
  switch (status) {
    case "running":
      return "In progress";
    case "awaiting-approval":
      return "Needs approval";
    case "promoted":
      return "Promoted";
    case "held":
      return "Held by agent";
    case "rejected":
      return "Changes requested";
  }
}

export function stageStatusLabel(status: StageStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "running":
      return "Running";
    case "passed":
      return "Passed";
    case "held":
      return "Held";
    case "failed":
      return "Failed";
    case "awaiting":
      return "Awaiting person";
    case "skipped":
      return "Not started";
  }
}

export function riskLabel(risk: Risk): string {
  return risk.charAt(0).toUpperCase() + risk.slice(1);
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${hh}:${mm} UTC`;
}

export function clockNow(): string {
  const date = new Date();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
