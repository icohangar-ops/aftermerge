import { STAGE_ORDER } from "@/lib/stages";
import type {
  LogLine,
  PipelineRun,
  Risk,
  Stage,
  StageId,
  StageStatus,
  ToolCall,
} from "@/lib/types";

function line(t: string, level: LogLine["level"], message: string): LogLine {
  return { t, level, message };
}

function tool(
  id: string,
  name: string,
  args: string,
  result: string,
  ok = true,
  duration = "1.2s",
): ToolCall {
  return { id, tool: name, args, result, ok, duration };
}

function stage(
  id: StageId,
  status: StageStatus,
  extra: Partial<Stage> = {},
): Stage {
  const meta = STAGE_ORDER.find((item) => item.id === id)!;
  return {
    id,
    label: meta.label,
    hint: meta.hint,
    status,
    risk: null,
    summary: "",
    reasoning: "",
    logs: [],
    toolCalls: [],
    ...extra,
  };
}

function skippedAfter(from: StageId): Stage[] {
  const start = STAGE_ORDER.findIndex((item) => item.id === from);
  return STAGE_ORDER.slice(start + 1).map((meta) =>
    stage(meta.id, "skipped", {
      summary: "Not started. The agent held the line before this stage.",
    }),
  );
}

const low: Risk = "low";
const medium: Risk = "medium";
const critical: Risk = "critical";

export const SEED_RUNS: PipelineRun[] = [
  {
    id: "AM-1841",
    mr: "!476",
    title: "fix: block after-hours dispatch when the tech cert is expired",
    repo: "fieldclear/dispatch-api",
    branch: "fix/after-hours-cert-gate",
    target: "main",
    author: "Priya Shah",
    sha: "9f2c1e4",
    mergedAt: "2026-10-01T12:14:00.000Z",
    status: "promoted",
    risk: low,
    decision:
      "Auto-promoted. Low risk, smoke green, Dana Okonkwo notified. No cert bypass left in the dispatch path.",
    approver: "Policy auto-promote",
    stages: [
      stage("sast", "passed", {
        risk: low,
        durationLabel: "41s",
        summary: "Clean. No new findings on the cert gate.",
        reasoning:
          "Semgrep on the GitLab SAST ruleset scanned the dispatch cert check and its tests. No secrets, no auth bypass. The new branch refuses a job when the technician's EPA or state cert is expired, including the after-hours queue.",
        logs: [
          line("12:14:08", "info", "semgrep --config p/gitlab-sast --config p/javascript"),
          line("12:14:22", "info", "rules=138 files=54 findings=0"),
          line("12:14:40", "agent", "No exploitable path. Continuing."),
        ],
        toolCalls: [
          tool(
            "sast-1",
            "semgrep.scan",
            "repo=fieldclear/dispatch-api sha=9f2c1e4",
            "0 findings",
            true,
            "32s",
          ),
        ],
      }),
      stage("deps", "passed", {
        risk: low,
        durationLabel: "22s",
        summary: "Production npm graph matches main. No new advisories.",
        reasoning:
          "Gemnasium and npm audit agree. The merge only touches dispatch policy code, not the lockfile.",
        logs: [
          line("12:15:01", "info", "gemnasium scan lockfile=package-lock.json"),
          line("12:15:18", "info", "new advisories=0"),
        ],
        toolCalls: [
          tool(
            "deps-1",
            "gemnasium.audit",
            "lockfile=package-lock.json",
            "no new advisories",
            true,
            "16s",
          ),
        ],
      }),
      stage("deploy", "passed", {
        risk: low,
        durationLabel: "1m 06s",
        summary: "staging.fieldclear.internal is serving sha 9f2c1e4.",
        reasoning: "Deploy job succeeded. Readiness probe returned 200.",
        logs: [
          line("12:15:30", "info", "gitlab environment=staging deploy sha=9f2c1e4"),
          line("12:16:28", "info", "GET https://staging.fieldclear.internal/health 200"),
        ],
        toolCalls: [
          tool(
            "deploy-1",
            "gitlab.deploy",
            "env=staging sha=9f2c1e4",
            "job=88421 status=success",
            true,
            "58s",
          ),
        ],
      }),
      stage("smoke", "passed", {
        risk: low,
        durationLabel: "54s",
        summary: "After-hours job with an expired cert is rejected. Valid cert still dispatches.",
        reasoning:
          "Both smoke cases match the field rule. Expired certs cannot be scheduled after 18:00 local, and a current cert still flows.",
        logs: [
          line("12:16:40", "info", "playwright tests/dispatch-cert.spec.ts"),
          line("12:17:02", "info", "expired cert after 18:00 → 409 CERT_EXPIRED"),
          line("12:17:21", "info", "valid cert after 18:00 → 201 dispatched"),
        ],
        toolCalls: [
          tool(
            "smoke-1",
            "playwright.smoke",
            "spec=dispatch-cert.spec.ts",
            "2 passed",
            true,
            "48s",
          ),
        ],
      }),
      stage("notes", "passed", {
        risk: low,
        durationLabel: "8s",
        summary:
          "Dispatch will refuse after-hours jobs when the assigned tech's cert is expired. Daytime behavior is unchanged. No migration.",
        reasoning: "Notes are factual and name the field-visible change. No waiver to disclose.",
        logs: [line("12:17:36", "agent", "Drafted notes for field ops.")],
        toolCalls: [
          tool(
            "notes-1",
            "agent.notes.draft",
            "audience=field-ops",
            "1 paragraph",
            true,
            "2s",
          ),
        ],
      }),
      stage("approval", "passed", {
        risk: low,
        durationLabel: "1s",
        summary: "Auto-promote under the low-risk policy. Dana Okonkwo notified.",
        reasoning:
          "Risk is low and smoke is green. FieldClear policy allows auto-promote. I posted the decision to the ops channel instead of blocking the line.",
        logs: [
          line("12:17:44", "agent", "Policy match: low + green smoke → auto-promote."),
          line("12:17:45", "info", "Notified Dana Okonkwo (field operations)."),
        ],
        toolCalls: [
          tool(
            "appr-1",
            "approval.policy",
            "risk=low smoke=green",
            "auto-promote",
            true,
            "0.2s",
          ),
        ],
      }),
      stage("promote", "passed", {
        risk: low,
        durationLabel: "1m 11s",
        summary: "Production is on sha 9f2c1e4.",
        reasoning: "Canary health on prod.fieldclear.internal stayed 200. Promote completed.",
        logs: [
          line("12:17:50", "info", "gitlab environment=production canary=10%"),
          line("12:18:40", "info", "GET https://prod.fieldclear.internal/health 200"),
          line("12:19:01", "agent", "Promoted. Run closed."),
        ],
        toolCalls: [
          tool(
            "prom-1",
            "gitlab.promote",
            "env=production sha=9f2c1e4",
            "status=success",
            true,
            "64s",
          ),
        ],
      }),
    ],
  },
  {
    id: "AM-1840",
    mr: "!479",
    title: "feat: require photo evidence before work-order closeout",
    repo: "fieldclear/mobile-tech",
    branch: "feat/closeout-photo",
    target: "main",
    author: "Elena Voss",
    sha: "b71aa03",
    mergedAt: "2026-10-01T11:02:00.000Z",
    status: "awaiting-approval",
    risk: medium,
    decision:
      "Smoke is green. Medium risk because closeout now blocks payroll-facing jobs. Waiting on Dana Okonkwo.",
    stages: [
      stage("sast", "passed", {
        risk: low,
        durationLabel: "38s",
        summary: "No findings in the camera or upload path.",
        reasoning:
          "The new closeout screen writes photos to the existing evidence bucket. Semgrep found no insecure storage or token leakage.",
        logs: [
          line("11:02:12", "info", "semgrep mobile-tech sha=b71aa03"),
          line("11:02:44", "info", "findings=0"),
        ],
        toolCalls: [
          tool("sast-1", "semgrep.scan", "sha=b71aa03", "0 findings", true, "29s"),
        ],
      }),
      stage("deps", "passed", {
        risk: low,
        durationLabel: "19s",
        summary: "No new advisories. Image picker versions match main.",
        reasoning: "Lockfile delta is empty for production dependencies.",
        logs: [line("11:03:08", "info", "gemnasium new advisories=0")],
        toolCalls: [
          tool("deps-1", "gemnasium.audit", "lockfile", "clean", true, "14s"),
        ],
      }),
      stage("deploy", "passed", {
        risk: low,
        durationLabel: "1m 18s",
        summary: "Technician staging build 1.36.0-rc.4 is installed on the device lab.",
        reasoning: "Staging deploy of the mobile shell completed and the lab device checked in.",
        logs: [
          line("11:03:30", "info", "uploaded staging build to device lab"),
          line("11:04:40", "info", "device lab-iphone-04 reported version 1.36.0-rc.4"),
        ],
        toolCalls: [
          tool(
            "deploy-1",
            "gitlab.deploy",
            "env=staging app=mobile-tech",
            "build=1.36.0-rc.4",
            true,
            "70s",
          ),
        ],
      }),
      stage("smoke", "passed", {
        risk: medium,
        durationLabel: "1m 02s",
        summary:
          "Closeout without a photo returns 422. Closeout with a photo completes. Offline queue still syncs.",
        reasoning:
          "Behavior matches the spec. I marked risk medium because a tech in a crawlspace with no signal can no longer close a job until the photo upload lands. That is a payroll-facing change, not a security defect.",
        logs: [
          line("11:05:01", "info", "closeout without photo → 422 PHOTO_REQUIRED"),
          line("11:05:20", "info", "closeout with photo → 200"),
          line("11:05:48", "info", "offline queue flushed 1 photo after reconnect"),
        ],
        toolCalls: [
          tool(
            "smoke-1",
            "playwright.smoke",
            "spec=closeout-photo.spec.ts",
            "3 passed",
            true,
            "55s",
          ),
        ],
      }),
      stage("notes", "passed", {
        risk: medium,
        durationLabel: "9s",
        summary:
          "Techs must attach a photo before closeout. Jobs stay open until the upload succeeds, including after an offline reconnect. Payroll will not see the job as complete without it.",
        reasoning:
          "Notes call out the payroll effect so the approver is not surprised. No security waiver.",
        logs: [line("11:06:10", "agent", "Drafted notes. Flagged payroll impact.")],
        toolCalls: [
          tool("notes-1", "agent.notes.draft", "audience=field-ops", "ready", true, "3s"),
        ],
      }),
      stage("approval", "awaiting", {
        risk: medium,
        summary: "Waiting on Dana Okonkwo, field operations.",
        reasoning:
          "Medium risk and a payroll-facing behavior change. Policy says I stop here. I will not promote the technician app until a person approves.",
        logs: [
          line("11:06:22", "agent", "Opened approval for Dana Okonkwo."),
          line("11:06:22", "info", "Channel: field-ops-approvals"),
        ],
        toolCalls: [
          tool(
            "appr-1",
            "approval.request",
            "approver=Dana Okonkwo risk=medium",
            "pending",
            true,
            "0.4s",
          ),
        ],
      }),
      stage("promote", "pending", {
        summary: "Production promote is locked until the gate opens.",
      }),
    ],
  },
  {
    id: "AM-1838",
    mr: "!461",
    title: "chore: bump @northline/invoice-pdf to 4.2.0",
    repo: "fieldclear/billing",
    branch: "chore/invoice-pdf-4-2-0",
    target: "main",
    author: "Chris Alvarez",
    sha: "e18d77b",
    mergedAt: "2026-09-30T21:40:00.000Z",
    status: "held",
    risk: critical,
    decision:
      "Held before staging. DEMO-CVE-1184 in libxmljs2 is reachable from customer invoice rendering.",
    stages: [
      stage("sast", "passed", {
        risk: low,
        durationLabel: "29s",
        summary: "Version bump only. No application diff beyond the lockfile and changelog.",
        reasoning:
          "SAST is clean because there is no new first-party code. Dependency risk is the next stage, not this one.",
        logs: [
          line("21:40:10", "info", "semgrep findings=0"),
          line("21:40:28", "agent", "No first-party diff. Moving to dependencies."),
        ],
        toolCalls: [
          tool("sast-1", "semgrep.scan", "sha=e18d77b", "0 findings", true, "21s"),
        ],
      }),
      stage("deps", "held", {
        risk: critical,
        durationLabel: "36s",
        summary:
          "Held. DEMO-CVE-1184 (critical, simulated) in libxmljs2 0.35.0 is on the invoice render path.",
        reasoning:
          "invoice-pdf 4.2.0 pulls libxmljs2 0.35.0. The advisory is a simulated XXE in the XML parser. billing/src/invoices/render.ts passes customer-supplied PO XML into that parser when a commercial job is invoiced. The vulnerable function is reachable. I am not deploying this to staging.",
        logs: [
          line("21:40:40", "info", "gemnasium advisory DEMO-CVE-1184 severity=critical"),
          line("21:40:48", "warn", "libxmljs2@0.35.0 introduced by @northline/invoice-pdf@4.2.0"),
          line("21:41:02", "info", "trace: render.ts → invoice-pdf → libxmljs2.parseXml"),
          line("21:41:10", "agent", "Reachable from customer PO XML. Holding before staging."),
        ],
        toolCalls: [
          tool(
            "deps-1",
            "gemnasium.audit",
            "lockfile=package-lock.json",
            "DEMO-CVE-1184 critical reachable",
            false,
            "18s",
          ),
          tool(
            "deps-2",
            "agent.reachability",
            "pkg=libxmljs2 entry=render.ts",
            "reachable via parseXml",
            true,
            "6s",
          ),
        ],
      }),
      ...skippedAfter("deps"),
    ],
  },
  {
    id: "AM-1836",
    mr: "!454",
    title: "fix: punch timestamps for crews crossing state lines",
    repo: "fieldclear/timeclock",
    branch: "fix/cross-state-punch",
    target: "main",
    author: "Andre Williams",
    sha: "66ac0d2",
    mergedAt: "2026-09-30T16:05:00.000Z",
    status: "promoted",
    risk: medium,
    approver: "Dana Okonkwo",
    decision:
      "Promoted after Dana Okonkwo approved a test-fixture waiver. Production punch path stores no hardcoded coordinates.",
    stages: [
      stage("sast", "passed", {
        risk: medium,
        durationLabel: "44s",
        summary:
          "One medium finding, waived. Hardcoded lat/long lives only in tests/fixtures/crew-ohio.json.",
        reasoning:
          "Semgrep flagged DEMO-SAST-221, a hardcoded geolocation in the Ohio crew fixture. The production punch writer reads coordinates from the device payload, not from that file. I recorded a waiver and continued. Risk stays medium because the change touches payroll timestamps.",
        logs: [
          line("16:05:12", "info", "semgrep findings=1 medium"),
          line("16:05:20", "warn", "DEMO-SAST-221 tests/fixtures/crew-ohio.json hardcoded lat/long"),
          line("16:05:33", "agent", "Fixture only. Waiver recorded. Not a production secret."),
        ],
        toolCalls: [
          tool(
            "sast-1",
            "semgrep.scan",
            "sha=66ac0d2",
            "1 medium, fixture only",
            true,
            "30s",
          ),
          tool(
            "sast-2",
            "agent.waiver.record",
            "id=DEMO-SAST-221",
            "waived, test fixture",
            true,
            "0.5s",
          ),
        ],
      }),
      stage("deps", "passed", {
        risk: low,
        durationLabel: "17s",
        summary: "No new advisories.",
        reasoning: "Lockfile unchanged aside from an already-cleared timezone data package.",
        logs: [line("16:06:01", "info", "gemnasium new advisories=0")],
        toolCalls: [
          tool("deps-1", "gemnasium.audit", "lockfile", "clean", true, "12s"),
        ],
      }),
      stage("deploy", "passed", {
        risk: low,
        durationLabel: "58s",
        summary: "Staging timeclock is on sha 66ac0d2.",
        reasoning: "Health check passed.",
        logs: [line("16:06:40", "info", "staging health 200")],
        toolCalls: [
          tool("deploy-1", "gitlab.deploy", "env=staging", "success", true, "51s"),
        ],
      }),
      stage("smoke", "passed", {
        risk: medium,
        durationLabel: "47s",
        summary:
          "A punch started in Ohio and closed in Pennsylvania keeps the crew's local offset. Payroll export matches.",
        reasoning: "The bug under test is fixed. Medium risk remains because payroll reads these timestamps.",
        logs: [
          line("16:07:10", "info", "OH→PA punch offset preserved"),
          line("16:07:28", "info", "payroll export row matches device local time"),
        ],
        toolCalls: [
          tool("smoke-1", "playwright.smoke", "spec=cross-state.spec.ts", "2 passed", true, "40s"),
        ],
      }),
      stage("notes", "passed", {
        risk: medium,
        durationLabel: "7s",
        summary:
          "Cross-state punches keep the local offset of the crew, not the server zone. Test fixture DEMO-SAST-221 was waived.",
        reasoning: "Waiver is visible in the notes so the approver sees it.",
        logs: [line("16:07:46", "agent", "Notes include the fixture waiver.")],
        toolCalls: [
          tool("notes-1", "agent.notes.draft", "audience=field-ops", "ready", true, "2s"),
        ],
      }),
      stage("approval", "passed", {
        risk: medium,
        durationLabel: "6m",
        summary: "Dana Okonkwo approved the fixture waiver and the payroll timestamp change.",
        reasoning:
          "Medium risk cannot auto-promote. The approver accepted the waiver because the coordinate is not in the production bundle.",
        logs: [line("16:13:52", "agent", "Approval recorded from Dana Okonkwo.")],
        toolCalls: [
          tool(
            "appr-1",
            "approval.request",
            "approver=Dana Okonkwo",
            "approved",
            true,
            "0.3s",
          ),
        ],
      }),
      stage("promote", "passed", {
        risk: medium,
        durationLabel: "1m 04s",
        summary: "Production timeclock is on sha 66ac0d2.",
        reasoning: "Promoted after the recorded approval. Canary stayed healthy.",
        logs: [line("16:15:01", "agent", "Promoted to production.")],
        toolCalls: [
          tool("prom-1", "gitlab.promote", "env=production", "success", true, "59s"),
        ],
      }),
    ],
  },
  {
    id: "AM-1833",
    mr: "!448",
    title: "feat: EPA 608 refrigerant recovery log export",
    repo: "fieldclear/compliance-portal",
    branch: "feat/epa-608-export",
    target: "main",
    author: "Maya Chen",
    sha: "1ab90cc",
    mergedAt: "2026-09-29T18:22:00.000Z",
    status: "promoted",
    risk: low,
    approver: "Policy auto-promote",
    decision:
      "Auto-promoted. Export is read-only, smoke checked a known recovery log, field ops notified.",
    stages: [
      stage("sast", "passed", {
        risk: low,
        durationLabel: "36s",
        summary: "Clean export path. No credential material in the CSV writer.",
        reasoning: "SAST clean on the new exporter.",
        logs: [line("18:22:20", "info", "semgrep findings=0")],
        toolCalls: [
          tool("sast-1", "semgrep.scan", "sha=1ab90cc", "0 findings", true, "28s"),
        ],
      }),
      stage("deps", "passed", {
        risk: low,
        durationLabel: "18s",
        summary: "No new advisories.",
        reasoning: "CSV library already on main.",
        logs: [line("18:22:48", "info", "gemnasium clean")],
        toolCalls: [
          tool("deps-1", "gemnasium.audit", "lockfile", "clean", true, "11s"),
        ],
      }),
      stage("deploy", "passed", {
        risk: low,
        durationLabel: "1m 02s",
        summary: "Staging compliance portal serving the export route.",
        reasoning: "Health check passed.",
        logs: [line("18:23:40", "info", "staging /health 200")],
        toolCalls: [
          tool("deploy-1", "gitlab.deploy", "env=staging", "success", true, "55s"),
        ],
      }),
      stage("smoke", "passed", {
        risk: low,
        durationLabel: "33s",
        summary: "Export for job FC-2291 matches the stored recovery quantities. Dry-run writes nothing.",
        reasoning: "Read-only export behaved correctly.",
        logs: [
          line("18:24:05", "info", "GET /exports/epa-608?job=FC-2291 200"),
          line("18:24:18", "info", "row count=4 quantities match ledger"),
        ],
        toolCalls: [
          tool("smoke-1", "playwright.smoke", "spec=epa-export.spec.ts", "2 passed", true, "27s"),
        ],
      }),
      stage("notes", "passed", {
        risk: low,
        durationLabel: "6s",
        summary:
          "Compliance portal can export an EPA 608 recovery log as CSV. The export does not change stored quantities.",
        reasoning: "Notes are enough for field ops. No waiver.",
        logs: [line("18:24:30", "agent", "Notes drafted.")],
        toolCalls: [
          tool("notes-1", "agent.notes.draft", "audience=field-ops", "ready", true, "2s"),
        ],
      }),
      stage("approval", "passed", {
        risk: low,
        durationLabel: "1s",
        summary: "Auto-promoted. Low risk, green smoke.",
        reasoning: "Policy match. Dana Okonkwo notified after promote.",
        logs: [line("18:24:36", "agent", "Auto-promote allowed.")],
        toolCalls: [
          tool("appr-1", "approval.policy", "risk=low", "auto-promote", true, "0.2s"),
        ],
      }),
      stage("promote", "passed", {
        risk: low,
        durationLabel: "1m 08s",
        summary: "Production compliance portal includes the export.",
        reasoning: "Promote finished cleanly.",
        logs: [line("18:25:50", "agent", "Promoted.")],
        toolCalls: [
          tool("prom-1", "gitlab.promote", "env=production", "success", true, "61s"),
        ],
      }),
    ],
  },
];
