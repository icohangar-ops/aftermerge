import { blankStages } from "@/lib/stages";
import type { PipelineRun, SimEvent, StageId } from "@/lib/types";

const NOTES = `FieldClear compliance-portal

- Nightly sync of EPA 608 refrigerant recovery logs to configured state portals
- Dry-run stays on for the first production night
- No database migration
- Follow-up: stop logging token prefixes on retry (compliance-portal#902)`;

type Timed = { at: number } & (
  | Omit<Extract<SimEvent, { type: "log" }>, "delay">
  | Omit<Extract<SimEvent, { type: "tool" }>, "delay">
  | Omit<Extract<SimEvent, { type: "stage" }>, "delay">
  | Omit<Extract<SimEvent, { type: "run" }>, "delay">
);

function withDelays(items: Timed[]): SimEvent[] {
  let prev = 0;
  return items.map((item) => {
    const delay = Math.max(0, item.at - prev);
    prev = item.at;
    const rest = { ...item };
    delete (rest as { at?: number }).at;
    return { ...rest, delay } as SimEvent;
  });
}

function log(
  at: number,
  stage: StageId,
  level: "info" | "warn" | "error" | "agent",
  message: string,
): Timed {
  return { at, type: "log", stage, level, message };
}

export function buildLiveRun(id: string, sequence: number): PipelineRun {
  const mr = `!${482 + (sequence - 1842)}`;
  const sha = sequence === 1842 ? "c4e91ab" : `c4e9${(sequence % 1000).toString(16).padStart(3, "0")}`;
  return {
    id,
    mr,
    title: "feat: nightly refrigerant log sync for state portals",
    repo: "fieldclear/compliance-portal",
    branch: "feat/refrigerant-portal-sync",
    target: "main",
    author: "Maya Chen",
    sha,
    mergedAt: new Date().toISOString(),
    status: "running",
    risk: "low",
    decision: "Merge received. Starting SAST on fieldclear/compliance-portal.",
    live: true,
    stages: blankStages(),
  };
}

export function preApprovalEvents(): SimEvent[] {
  return withDelays([
    {
      at: 200,
      type: "run",
      status: "running",
      decision: "Merge received. Starting SAST on fieldclear/compliance-portal.",
    },
    { at: 400, type: "stage", stage: "sast", status: "running" },
    log(1200, "sast", "info", "Cloning fieldclear/compliance-portal@c4e91ab"),
    log(4000, "sast", "info", "semgrep --config p/gitlab-sast --config p/javascript"),
    log(8000, "sast", "info", "rules=142 scanned_files=86"),
    log(
      12000,
      "sast",
      "warn",
      "src/sync/portal-client.ts:88 medium DEMO-SAST-084 token prefix written on retry",
    ),
    log(
      15000,
      "sast",
      "info",
      "tests/fixtures/portal-sandbox.json low DEMO-SAST-085 sample client id",
    ),
    {
      at: 18000,
      type: "tool",
      stage: "sast",
      call: {
        tool: "semgrep.scan",
        args: "config=p/gitlab-sast sha=c4e91ab",
        result: "1 medium, 1 low",
        ok: true,
        duration: "11.4s",
      },
    },
    log(
      21000,
      "sast",
      "agent",
      "Production LOG_LEVEL is info. The log line keeps four characters, not the token. Filing compliance-portal#902.",
    ),
    {
      at: 23000,
      type: "tool",
      stage: "sast",
      call: {
        tool: "gitlab.issue.create",
        args: "project=compliance-portal title=Stop logging portal token prefixes",
        result: "#902 opened",
        ok: true,
        duration: "0.6s",
      },
    },
    log(25000, "sast", "agent", "Non-blocking. Risk moves to medium. I will not auto-promote."),
    {
      at: 26000,
      type: "stage",
      stage: "sast",
      status: "passed",
      risk: "medium",
      durationLabel: "26s",
      summary:
        "Medium finding waived with follow-up #902. Token prefix only, production log level is info.",
      reasoning:
        "Semgrep reported DEMO-SAST-084: on retry, portal-client.ts logs the first four characters of the state-portal token. Production LOG_LEVEL is info, so the line does not ship. Four characters are not a usable credential, and the job's service account is scoped to one portal. I opened compliance-portal#902. The fixture finding is test-only. Risk stays medium, so policy will stop me before production.",
    },
    {
      at: 26800,
      type: "run",
      risk: "medium",
      decision:
        "SAST waived with follow-up #902. Risk is medium — continuing, but I will not auto-promote.",
    },
    { at: 27500, type: "stage", stage: "deps", status: "running" },
    log(30000, "deps", "info", "gemnasium scan package-lock.json"),
    log(33000, "deps", "info", "npm audit --omit=dev --json"),
    log(
      37000,
      "deps",
      "warn",
      "DEMO-GHSA-fxp-4411 high fast-xml-parser@5.2.1 via scripts/portal-fixture.ts",
    ),
    log(40000, "deps", "info", "Production graph does not import fast-xml-parser."),
    {
      at: 43000,
      type: "tool",
      stage: "deps",
      call: {
        tool: "gemnasium.audit",
        args: "lockfile=package-lock.json",
        result: "1 high, dev-script only",
        ok: true,
        duration: "8.1s",
      },
    },
    {
      at: 45000,
      type: "tool",
      stage: "deps",
      call: {
        tool: "agent.waiver.record",
        args: "id=DEMO-GHSA-fxp-4411 reason=not on sync runtime path",
        result: "waiver stored",
        ok: true,
        duration: "0.4s",
      },
    },
    {
      at: 47000,
      type: "stage",
      stage: "deps",
      status: "passed",
      risk: "medium",
      durationLabel: "20s",
      summary:
        "High advisory waived. fast-xml-parser is only imported by the fixture script.",
      reasoning:
        "Gemnasium flagged DEMO-GHSA-fxp-4411 (high, simulated) in fast-xml-parser 5.2.1. The only importer is scripts/portal-fixture.ts, which builds local XML samples and is not in the sync job's production graph. npm audit on the production dependency set is clean. I recorded the waiver and I'm deploying to staging. Overall risk stays medium because of the SAST follow-up.",
    },
    { at: 48000, type: "stage", stage: "deploy", status: "running" },
    log(51000, "deploy", "info", "gitlab environment=staging ref=c4e91ab"),
    log(54000, "deploy", "info", "job deploy:staging status=running"),
    log(57000, "deploy", "info", "GET https://staging.fieldclear.internal/health 200"),
    {
      at: 58500,
      type: "tool",
      stage: "deploy",
      call: {
        tool: "gitlab.deploy",
        args: "env=staging sha=c4e91ab",
        result: "job success, health 200",
        ok: true,
        duration: "9s",
      },
    },
    {
      at: 59500,
      type: "stage",
      stage: "deploy",
      status: "passed",
      risk: "low",
      durationLabel: "12s",
      summary: "staging.fieldclear.internal is serving c4e91ab.",
      reasoning:
        "The staging deploy job finished and the readiness probe returned 200. Smoke tests can hit the sync dry-run from here.",
    },
    { at: 60500, type: "stage", stage: "smoke", status: "running" },
    log(62500, "smoke", "info", "playwright tests/portal-sync.spec.ts"),
    log(64500, "smoke", "info", "dry-run posts zero quantity rows → passed"),
    log(66500, "smoke", "error", "retry-on-429 → 429 from portal mock, attempt 1"),
    log(68500, "smoke", "agent", "Mock portal rate-limited the first call. Rerunning that test once."),
    log(70500, "smoke", "info", "retry-on-429 attempt 2 → 200 after backoff. Ledger unchanged."),
    {
      at: 71500,
      type: "tool",
      stage: "smoke",
      call: {
        tool: "playwright.smoke",
        args: "spec=portal-sync.spec.ts retries=1",
        result: "3 passed (1 retried)",
        ok: true,
        duration: "11s",
      },
    },
    {
      at: 72500,
      type: "stage",
      stage: "smoke",
      status: "passed",
      risk: "low",
      durationLabel: "12s",
      summary:
        "Dry-run wrote nothing. The 429 retry passed on the second attempt. Ledger unchanged.",
      reasoning:
        "Three smokes: dry-run creates no quantity rows, the job backs off on a 429 from the state-portal mock, and the recovery ledger is unchanged. The first 429 attempt failed. I reran that test once rather than holding the release — the mock documents a rate limit, and the backoff path is what we are proving. Smoke is green.",
    },
    { at: 73500, type: "stage", stage: "notes", status: "running" },
    log(76000, "notes", "agent", "Drafting release notes for field operations."),
    log(79000, "notes", "info", "Included waiver #902 and the dev-only XML advisory."),
    {
      at: 82000,
      type: "tool",
      stage: "notes",
      call: {
        tool: "agent.notes.draft",
        args: "audience=field-ops sha=c4e91ab",
        result: "4 bullets",
        ok: true,
        duration: "2.1s",
      },
    },
    {
      at: 85000,
      type: "stage",
      stage: "notes",
      status: "passed",
      risk: "medium",
      durationLabel: "12s",
      summary: NOTES,
      reasoning:
        "Notes name the nightly sync, the first-night dry-run, the lack of a migration, and follow-up #902. The dev-only XML waiver is in the decision log. A person can approve from this text without reading the job trace.",
    },
    {
      at: 87000,
      type: "stage",
      stage: "approval",
      status: "awaiting",
      risk: "medium",
      summary: "Waiting on Dana Okonkwo, field operations.",
      reasoning:
        "Risk is medium because of the token-prefix follow-up and a compliance sync that can touch state portals. FieldClear policy does not let me promote. I am requesting approval from Dana Okonkwo and stopping here.",
    },
    log(87800, "approval", "agent", "Approval requested. Production promote is locked."),
    {
      at: 88500,
      type: "tool",
      stage: "approval",
      call: {
        tool: "approval.request",
        args: "approver=Dana Okonkwo risk=medium run=live",
        result: "pending",
        ok: true,
        duration: "0.3s",
      },
    },
    {
      at: 89000,
      type: "run",
      status: "awaiting-approval",
      risk: "medium",
      decision:
        "Medium risk. Policy requires Dana Okonkwo before production. Staging is green.",
    },
  ]);
}

export function promoteEvents(): SimEvent[] {
  return withDelays([
    log(200, "approval", "agent", "Dana Okonkwo approved promote to production."),
    {
      at: 400,
      type: "stage",
      stage: "approval",
      status: "passed",
      risk: "medium",
      durationLabel: "gate",
      summary: "Approved by Dana Okonkwo, field operations.",
      reasoning:
        "The approver accepted the medium-risk release: dry-run stays on for the first night, and #902 tracks the token-prefix log.",
    },
    {
      at: 700,
      type: "run",
      status: "running",
      approver: "Dana Okonkwo",
      decision: "Approved by Dana Okonkwo. Promoting to production with dry-run left on.",
    },
    { at: 1100, type: "stage", stage: "promote", status: "running" },
    log(1800, "promote", "info", "gitlab environment=production sha=c4e91ab canary=10%"),
    log(3200, "promote", "info", "GET https://prod.fieldclear.internal/health 200"),
    log(4200, "promote", "info", "sync job registered, DRY_RUN=true for the first night"),
    {
      at: 5000,
      type: "tool",
      stage: "promote",
      call: {
        tool: "gitlab.promote",
        args: "env=production sha=c4e91ab dry_run=true",
        result: "promoted",
        ok: true,
        duration: "3.6s",
      },
    },
    {
      at: 5800,
      type: "stage",
      stage: "promote",
      status: "passed",
      risk: "medium",
      durationLabel: "5s",
      summary:
        "Production is on c4e91ab. The nightly sync is registered with dry-run on.",
      reasoning:
        "Canary health returned 200. I promoted compliance-portal and left DRY_RUN=true so the first night cannot write refrigerant quantities to a state portal. The decision log names the approver.",
    },
    {
      at: 6400,
      type: "run",
      status: "promoted",
      approver: "Dana Okonkwo",
      decision:
        "Promoted to production after Dana Okonkwo approved. Dry-run stays on for the first night. Follow-up #902 is open.",
    },
  ]);
}

export function rejectPatch(approver = "Dana Okonkwo"): SimEvent[] {
  return [
    {
      delay: 0,
      type: "log",
      stage: "approval",
      level: "agent",
      message: `${approver} requested changes. Promote cancelled.`,
    },
    {
      delay: 0,
      type: "stage",
      stage: "approval",
      status: "held",
      risk: "medium",
      durationLabel: "gate",
      summary: `${approver} requested changes.`,
      reasoning:
        "The approver stopped the release at the gate. I will not deploy to production. Staging can stay up for another look at the token-prefix follow-up.",
    },
    {
      delay: 0,
      type: "stage",
      stage: "promote",
      status: "skipped",
      summary: "Not started. Changes were requested at the gate.",
      reasoning: "Production promote was cancelled with the approval.",
    },
    {
      delay: 0,
      type: "run",
      status: "rejected",
      approver,
      decision: `${approver} requested changes. Production promote was not run.`,
    },
  ];
}
