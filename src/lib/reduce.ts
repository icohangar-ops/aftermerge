import { clockNow } from "@/lib/stages";
import type { PipelineRun, SimEvent } from "@/lib/types";

export function applyEvent(run: PipelineRun, event: SimEvent): PipelineRun {
  const now = new Date().toISOString();

  if (event.type === "run") {
    return {
      ...run,
      status: event.status ?? run.status,
      risk: event.risk ?? run.risk,
      decision: event.decision ?? run.decision,
      approver: event.approver ?? run.approver,
    };
  }

  return {
    ...run,
    stages: run.stages.map((stage) => {
      if (stage.id !== event.stage) return stage;

      if (event.type === "log") {
        return {
          ...stage,
          logs: [
            ...stage.logs,
            { t: clockNow(), level: event.level, message: event.message },
          ],
        };
      }

      if (event.type === "tool") {
        return {
          ...stage,
          toolCalls: [
            ...stage.toolCalls,
            {
              ...event.call,
              id: event.call.id ?? `${stage.id}-${stage.toolCalls.length + 1}`,
            },
          ],
        };
      }

      return {
        ...stage,
        status: event.status,
        risk: event.risk === undefined ? stage.risk : event.risk,
        summary: event.summary ?? stage.summary,
        reasoning: event.reasoning ?? stage.reasoning,
        durationLabel: event.durationLabel ?? stage.durationLabel,
        startedAt: event.status === "running" ? (stage.startedAt ?? now) : stage.startedAt,
        finishedAt:
          event.status === "running" || event.status === "pending"
            ? stage.finishedAt
            : now,
      };
    }),
  };
}
